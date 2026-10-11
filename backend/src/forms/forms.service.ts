import { featurePlanSql } from '../billing/feature-plan-policy';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FormDraft,
  FormSummary,
  FormCollectionPage,
  FormSubmission,
  FormSubmissionsPage,
  FormSubmissionFilters,
  FormAnalytics,
  PublicPageAnalytics,
} from '@linktree/types';
import { FORM_COMPLETION_CTES } from './forms-analytics-query';
import { slugifyPublicPageName } from '../common/public-page-slug';
import { PRIVACY_VERSION } from '../common/legal-versions';
import { DatabaseService } from '../database/database.service';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { StorageService } from '../storage/storage.service';
import {
  UnifiedAnalyticsService,
  CLICK_EVENTS,
  type AnalyticsRequestContext,
} from '../analytics/unified-analytics.service';
import {
  validateDefinition,
  validateSubmission,
  validateSubmissionPayload,
} from './form-validation';

type FormRow = {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  status: FormDraft['status'];
  is_archived: boolean;
  archived_at: Date | string | null;
  definition: FormDraft;
  revision: number;
  submission_count: number;
  updated_at: Date | string;
};
function mapped(row: FormRow): FormDraft {
  return {
    ...row.definition,
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    isArchived: row.is_archived,
    archivedAt: row.archived_at
      ? new Date(row.archived_at).toISOString()
      : null,
    revision: row.revision,
    submissionCount: row.submission_count,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
export function formSlug(headline: string): string {
  return slugifyPublicPageName(headline) || 'form';
}
@Injectable()
export class FormsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspace: PlatformContentWorkspaceService,
    private readonly storage: StorageService,
    private readonly analytics: UnifiedAnalyticsService,
  ) {}
  platformOwner() {
    return this.workspace.getWorkspaceId();
  }
  async list(
    owner: string,
    page = 0,
    query = '',
    archived = false,
  ): Promise<FormCollectionPage> {
    const values = [owner, archived, `%${query.replace(/[\\%_]/g, '\\$&')}%`];
    const where =
      'business_id=$1 AND is_archived=$2::boolean AND name ILIKE $3';
    const result = await this.db.query<FormSummary>(
      `WITH selected_forms AS (
         SELECT id,name,slug,status,is_archived AS "isArchived",archived_at AS "archivedAt",definition->>'layout' layout,definition->>'language' language,definition->>'logo' logo,definition->>'description' description,revision,submission_count AS "submissionCount",jsonb_array_length(definition->'questions') AS "questionCount",created_at AS "createdAt",updated_at AS "updatedAt" FROM forms WHERE ${where} ORDER BY updated_at DESC,id LIMIT 20 OFFSET $4
       ) SELECT form.*,traffic.views,traffic.interactions FROM selected_forms form
       LEFT JOIN LATERAL (
         SELECT count(DISTINCT event.visitor_id) FILTER (WHERE event.event_name='page_view')::integer views,
                count(DISTINCT event.visitor_id) FILTER (WHERE event.event_name=ANY($5::text[]))::integer interactions
         FROM public_pages page JOIN analytics_events event ON event.public_page_id=page.id
         WHERE page.business_id=$1 AND page.source_form_id=form.id AND page.page_type='form' AND event.is_bot=false
       ) traffic ON true ORDER BY form."updatedAt" DESC,form.id`,
      [...values, page * 20, [...CLICK_EVENTS]],
    );
    const count = await this.db.query<{ total: string }>(
      `SELECT count(*)::text total FROM forms WHERE ${where}`,
      values,
    );
    return { items: result.rows, total: Number(count.rows[0].total) };
  }
  async get(owner: string, id: string) {
    const result = await this.db.query<FormRow>(
      'SELECT * FROM forms WHERE business_id=$1 AND id=$2',
      [owner, id],
    );
    if (!result.rows[0]) throw new NotFoundException('Form not found');
    return mapped(result.rows[0]);
  }
  async create(owner: string, body: unknown) {
    const definition = validateDefinition(body, false);
    if (!(await this.storage.areBusinessAssetsOwned(owner, definition)))
      throw new BadRequestException('Invalid form images');
    let status: FormDraft['status'] = 'active';
    try {
      validateDefinition(body, true);
    } catch {
      status = 'paused';
    }
    const slug = `${formSlug(definition.headline)}`;
    return this.db.transaction(async (client) => {
      // Serialize slug allocation for this owner without an unsafe read/insert race.
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [`forms:${owner}`],
      );
      const existing = await client.query<{ slug: string }>(
        "SELECT slug FROM forms WHERE business_id=$1 AND (slug=$2 OR slug LIKE $2||'-%')",
        [owner, slug],
      );
      const used = new Set(existing.rows.map((r) => r.slug));
      let allocated = slug;
      let suffix = 2;
      while (used.has(allocated)) allocated = `${slug}-${suffix++}`;
      const result = await client.query<FormRow>(
        'INSERT INTO forms(business_id,slug,name,status,definition) VALUES($1,$2,$3,$5,$4::jsonb) RETURNING *',
        [owner, allocated, definition.name, JSON.stringify(definition), status],
      );
      return mapped(result.rows[0]);
    });
  }
  async update(owner: string, id: string, body: unknown) {
    const existing = await this.get(owner, id);
    const definition = validateDefinition(body, existing.status === 'active');
    if (!definition.revision)
      throw new BadRequestException('Form version is required');
    if (!(await this.storage.areBusinessAssetsOwned(owner, definition)))
      throw new BadRequestException('Invalid form images');
    const result = await this.db.query<FormRow>(
      `UPDATE forms SET name=$3,definition=$4::jsonb,revision=revision+1,updated_at=now() WHERE business_id=$1 AND id=$2 AND revision=$5 AND status=$6 RETURNING *`,
      [
        owner,
        id,
        definition.name,
        JSON.stringify(definition),
        definition.revision,
        existing.status,
      ],
    );
    if (!result.rows[0]) {
      await this.get(owner, id);
      throw new ConflictException('This form changed. Refresh before saving.');
    }
    return mapped(result.rows[0]);
  }
  async status(owner: string, id: string, status: unknown) {
    if (typeof status !== 'string' || !['active', 'paused'].includes(status))
      throw new BadRequestException('Invalid form status');
    return this.db.transaction(async (client) => {
      const locked = await client.query<FormRow>(
        'SELECT * FROM forms WHERE business_id=$1 AND id=$2 FOR UPDATE',
        [owner, id],
      );
      if (!locked.rows[0]) throw new NotFoundException('Form not found');
      const form = mapped(locked.rows[0]);
      if (status === 'active') validateDefinition(form, true);
      const updated = await client.query<FormRow>(
        'UPDATE forms SET status=$3,updated_at=now() WHERE business_id=$1 AND id=$2 RETURNING *',
        [owner, id, status],
      );
      return mapped(updated.rows[0]);
    });
  }
  async archive(owner: string, id: string, isArchived: unknown) {
    if (typeof isArchived !== 'boolean')
      throw new BadRequestException('Invalid archive value');
    const result = await this.db.query<FormRow>(
      'UPDATE forms SET is_archived=$3,archived_at=CASE WHEN $3::boolean THEN coalesce(archived_at,now()) ELSE NULL END,updated_at=now() WHERE business_id=$1 AND id=$2 RETURNING *',
      [owner, id, isArchived],
    );
    if (!result.rows[0]) throw new NotFoundException('Form not found');
    return mapped(result.rows[0]);
  }
  async duplicate(owner: string, id: string) {
    const source = await this.get(owner, id);
    return this.create(owner, {
      ...source,
      isArchived: false,
      archivedAt: null,
      headline: `${source.headline.slice(0, 90)} (copy)`,
    });
  }
  async delete(owner: string, id: string) {
    const result = await this.db.query(
      'DELETE FROM forms WHERE business_id=$1 AND id=$2 RETURNING id',
      [owner, id],
    );
    if (!result.rows.length) throw new NotFoundException('Form not found');
  }
  async deleteSubmissions(owner: string, id: string) {
    return this.db.transaction(async (client) => {
      // Submission creation takes the same row lock, keeping the count consistent.
      const owned = await client.query(
        'SELECT id FROM forms WHERE business_id=$1 AND id=$2 FOR UPDATE',
        [owner, id],
      );
      if (!owned.rows.length) throw new NotFoundException('Form not found');
      const deleted = await client.query(
        'DELETE FROM form_submissions WHERE form_id=$1',
        [id],
      );
      await this.analytics.clear(owner, id, client);
      await client.query(
        'UPDATE forms SET submission_count=0 WHERE business_id=$1 AND id=$2',
        [owner, id],
      );
      return { deleted: deleted.rowCount ?? 0 };
    });
  }
  private async publicOwner(subdomain: string, slug?: string) {
    if (slug !== undefined && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug))
      throw new NotFoundException('Form not found');
    if (!subdomain) return this.platformOwner();
    const result = await this.db.query<{ id: string }>(
      `SELECT business.id FROM businesses business WHERE business.subdomain=$1 AND business.status='active' AND business.account_type='business' AND ${featurePlanSql('forms', 'business')}`,
      [subdomain],
    );
    if (!result.rows[0]) throw new NotFoundException('Form not found');
    return result.rows[0].id;
  }
  async publicStatus(subdomain: string, slug: string) {
    const owner = await this.publicOwner(subdomain, slug);
    const result = await this.db.query<{ slug: string }>(
      "SELECT form.slug FROM forms form JOIN businesses business ON business.id=form.business_id WHERE form.business_id=$1 AND form.slug=$2 AND form.status='active' AND business.status='active'",
      [owner, slug],
    );
    if (!result.rows[0]) throw new NotFoundException('Form not found');
    return result.rows[0];
  }
  async publicForm(subdomain: string, slug: string) {
    const owner = await this.publicOwner(subdomain, slug);
    const result = await this.db.query<
      FormRow & { business_logo: string | null }
    >(
      "SELECT f.*, branding.logo AS business_logo FROM forms f LEFT JOIN business_branding branding ON branding.business_id=f.business_id WHERE f.business_id=$1 AND f.slug=$2 AND f.status='active'",
      [owner, slug],
    );
    if (!result.rows[0]) throw new NotFoundException('Form not found');
    const form = mapped(result.rows[0]);
    delete form.submissionCount;
    const actions = await this.db.query<{
      id: string;
      action_key: string;
      tiktok_event: 'SubmitForm' | 'ClickButton';
    }>(
      "SELECT action.id,action.action_key,action.tiktok_event FROM public_page_actions action JOIN public_pages page ON page.id=action.public_page_id WHERE page.source_form_id=$1 AND action.status='active'",
      [form.id],
    );
    const analytics: PublicPageAnalytics = {
      pixelIds: [],
      actions: Object.fromEntries(
        actions.rows.map((a) => [
          a.action_key,
          { id: a.id, pixelEvent: a.tiktok_event },
        ]),
      ),
    };
    return {
      form,
      analytics,
      privacyVersion: PRIVACY_VERSION,
      businessLogo: result.rows[0].business_logo ?? null,
    };
  }
  async submit(
    subdomain: string,
    slug: string,
    body: unknown,
    context: AnalyticsRequestContext,
  ) {
    const owner = await this.publicOwner(subdomain, slug);
    return this.db.transaction(async (client) => {
      const result = await client.query<FormRow>(
        "SELECT form.* FROM forms form JOIN businesses business ON business.id=form.business_id WHERE form.business_id=$1 AND form.slug=$2 AND form.status='active' AND business.status='active' FOR UPDATE OF form",
        [owner, slug],
      );
      if (!result.rows[0]) throw new NotFoundException('Form unavailable');
      const form = mapped(result.rows[0]);
      const payload = validateSubmissionPayload(body);
      // A retry after an uncertain network result returns the same receipt.
      const old = await client.query<{ id: string }>(
        'SELECT id FROM form_submissions WHERE form_id=$1 AND request_id=$2',
        [form.id, payload.requestId],
      );
      if (old.rows[0]) return { id: old.rows[0].id };
      const validated = validateSubmission(payload, form);
      if (validated.input.revision !== form.revision)
        throw new ConflictException(
          'This form changed. Reload it before submitting.',
        );
      const saved = await client.query<{ id: string }>(
        'INSERT INTO form_submissions(form_id,request_id,revision,answers,consent,duration_ms,privacy_version) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7) RETURNING id',
        [
          form.id,
          validated.input.requestId,
          form.revision,
          JSON.stringify(validated.answers),
          validated.input.consent,
          validated.input.durationMs ?? null,
          validated.input.consent ? PRIVACY_VERSION : null,
        ],
      );
      await client.query(
        'UPDATE forms SET submission_count=submission_count+1 WHERE id=$1',
        [form.id],
      );
      const action = await client.query<{ id: string }>(
        "SELECT action.id FROM public_page_actions action JOIN public_pages page ON page.id=action.public_page_id WHERE page.source_form_id=$1 AND action.action_key='form:submit'",
        [form.id],
      );
      await this.analytics.ingest(
        {
          eventId: validated.input.requestId,
          pageId: form.id,
          actionId: action.rows[0]?.id,
          eventName: 'form_submit',
          visitorId: validated.input.tracking.visitorId,
          sessionId: validated.input.tracking.sessionId,
          occurredAt: new Date().toISOString(),
          pageUrl: validated.input.tracking.pageUrl,
          referrer: validated.input.tracking.referrer,
          consentState: 'unknown',
        },
        context,
        client,
      );
      await client.query(
        'UPDATE form_submissions SET analytics_event_id=(SELECT id FROM analytics_events WHERE event_id=$2 AND business_id=$3) WHERE id=$1',
        [saved.rows[0].id, validated.input.requestId, owner],
      );
      return { id: saved.rows[0].id };
    });
  }
  async submissions(
    owner: string,
    id: string,
    page: number,
    filters: FormSubmissionFilters = {},
  ): Promise<FormSubmissionsPage> {
    const owned = await this.db.query<{ snapshotAt: Date }>(
      'SELECT CURRENT_TIMESTAMP AS "snapshotAt" FROM forms WHERE business_id=$1 AND id=$2',
      [owner, id],
    );
    if (!owned.rows.length) throw new NotFoundException('Form not found');
    if (filters.from && filters.to && filters.from > filters.to)
      throw new BadRequestException('Invalid date range');
    const snapshotAt = filters.before ?? owned.rows[0].snapshotAt.toISOString();
    const pageSize = filters.pageSize ?? 20;
    const values = [
      id,
      `%${(filters.q ?? '').trim().replace(/[\\%_]/g, '\\$&')}%`,
      filters.from ?? null,
      filters.to ?? null,
      snapshotAt,
    ];
    const where = `response.form_id=$1
      AND ($3::date IS NULL OR response.created_at >= ($3::date::timestamp AT TIME ZONE 'UTC'))
      AND ($4::date IS NULL OR response.created_at < (($4::date + 1)::timestamp AT TIME ZONE 'UTC'))
      AND ($5::timestamptz IS NULL OR response.created_at <= $5::timestamptz)
      AND ($2='%%' OR EXISTS (SELECT 1 FROM jsonb_array_elements(response.answers) answer WHERE answer->>'value' ILIKE $2)
        OR event.utm_source ILIKE $2 OR event.utm_campaign ILIKE $2 OR event.country_code ILIKE $2 OR response.id::text ILIKE $2)`;
    const joined = `FROM form_submissions response LEFT JOIN analytics_events event ON event.id=response.analytics_event_id AND event.business_id=$6`;
    const result = await this.db.query<FormSubmission & { total: string }>(
      `SELECT response.id,response.created_at AS "createdAt",response.revision,response.answers,response.consent,response.privacy_version AS "privacyVersion",response.duration_ms AS "durationMs",jsonb_build_object('channel',event.channel,'campaign',event.utm_campaign,'source',event.utm_source,'medium',event.utm_medium,'country',event.country_code,'device',event.device_type) attribution,count(*) OVER()::text total ${joined} WHERE ${where} ORDER BY response.created_at DESC,response.id DESC LIMIT $7 OFFSET $8`,
      [...values, owner, pageSize, page * pageSize],
    );
    const total =
      result.rows[0]?.total ??
      (
        await this.db.query<{ total: string }>(
          `SELECT count(*)::text total ${joined} WHERE ${where}`,
          [...values, owner],
        )
      ).rows[0].total;
    return {
      items: result.rows.map(({ total: _total, ...row }) => row),
      total: Number(total),
      snapshotAt,
    };
  }
  async getAnalytics(owner: string, id: string): Promise<FormAnalytics> {
    await this.get(owner, id);
    const result = await this.db.query<{ id: string }>(
      "SELECT id FROM public_pages WHERE business_id=$1 AND source_form_id=$2 AND page_type='form'",
      [owner, id],
    );
    const page = result.rows[0];
    if (!page) throw new NotFoundException('Form analytics not found');
    const [summary, metrics, insights] = await Promise.all([
      this.analytics.getSummary(owner, { pageId: page.id }),
      this.stats(owner, id),
      this.responseInsights(owner, id),
    ]);
    return { ...summary, ...metrics, clicks: summary.total_clicks, insights };
  }
  private async responseInsights(
    owner: string,
    id: string,
  ): Promise<NonNullable<FormAnalytics['insights']>> {
    const result = await this.db.query<{
      insights: NonNullable<FormAnalytics['insights']>;
    }>(
      `WITH ${FORM_COMPLETION_CTES}, responses AS (
        SELECT response.created_at,response.duration_ms,response.answers,event.utm_source AS source,event.device_type AS device,event.country_code AS country
        FROM form_submissions response LEFT JOIN analytics_events event ON event.id=response.analytics_event_id AND event.business_id=$1
        WHERE response.form_id=$2 AND EXISTS (SELECT 1 FROM forms form WHERE form.id=response.form_id AND form.business_id=$1)
      ), choice_questions AS (
        SELECT question->>'id' AS id,question->>'label' AS label,question->'options' AS options,position
        FROM forms form CROSS JOIN LATERAL jsonb_array_elements(form.definition->'questions') WITH ORDINALITY entry(question,position)
        WHERE form.id=$2 AND form.business_id=$1 AND question->>'type'='choice'
      ), answer_counts AS (
        SELECT question.id,answer->>'value' AS value,count(*)::integer count FROM responses
        CROSS JOIN LATERAL jsonb_array_elements(responses.answers) answer
        JOIN choice_questions question ON question.id=answer->>'questionId'
        WHERE coalesce(answer->>'value','')<>'' GROUP BY question.id,answer->>'value'
      ), choice_results AS (
        SELECT question.*,coalesce((SELECT sum(count) FROM answer_counts WHERE id=question.id),0)::integer total FROM choice_questions question
      ), daily AS (
        SELECT (created_at AT TIME ZONE 'UTC')::date AS bucket,count(*)::integer count FROM responses
        WHERE created_at >= (((now() AT TIME ZONE 'UTC')::date - 13)::timestamp AT TIME ZONE 'UTC') GROUP BY 1
      ) SELECT jsonb_build_object(
        'sourcePerformance',(SELECT coalesce(jsonb_agg(entry),'[]'::jsonb) FROM (
          SELECT nullif(source,'') label,count(*)::integer starts,count(*) FILTER (WHERE completed)::integer responses,
            round(100.0*count(*) FILTER (WHERE completed)/nullif(count(*),0),1) rate
          FROM session_results GROUP BY source ORDER BY responses DESC,starts DESC,source LIMIT 10
        ) entry),
        'answerSummaries',(SELECT coalesce(jsonb_agg(jsonb_build_object(
          'questionId',question.id,'label',question.label,'totalAnswers',question.total,
          'options',(SELECT coalesce(jsonb_agg(jsonb_build_object('label',option.label,'count',option.count,'percentage',coalesce(round(100.0*option.count/nullif(question.total,0),1),0)) ORDER BY option.position),'[]'::jsonb) FROM (
            SELECT option.value label,coalesce(counts.count,0) count,option.position FROM jsonb_array_elements_text(question.options) WITH ORDINALITY option(value,position)
            LEFT JOIN answer_counts counts ON counts.id=question.id AND counts.value=option.value
            UNION ALL SELECT NULL,sum(count)::integer,999 FROM answer_counts WHERE id=question.id AND NOT (question.options ? value) HAVING sum(count)>0
          ) option)
        ) ORDER BY question.position),'[]'::jsonb) FROM choice_results question),
        'averageDurationMs',(SELECT round(avg(duration_ms)) FROM responses WHERE duration_ms IS NOT NULL),
        'latestSubmissionAt',(SELECT max(created_at) FROM responses),
        'daily',(SELECT jsonb_agg(jsonb_build_object('day',days.bucket::date,'count',coalesce(daily.count,0)) ORDER BY days.bucket) FROM generate_series((now() AT TIME ZONE 'UTC')::date - 13,(now() AT TIME ZONE 'UTC')::date,'1 day') days(bucket) LEFT JOIN daily ON daily.bucket=days.bucket::date),
        'sources',(SELECT coalesce(jsonb_agg(entry),'[]'::jsonb) FROM (SELECT source label,count(*)::integer count FROM responses GROUP BY source ORDER BY count DESC,source NULLS LAST LIMIT 5) entry),
        'devices',(SELECT coalesce(jsonb_agg(entry),'[]'::jsonb) FROM (SELECT device label,count(*)::integer count FROM responses GROUP BY device ORDER BY count DESC,device NULLS LAST LIMIT 5) entry),
        'countries',(SELECT coalesce(jsonb_agg(entry),'[]'::jsonb) FROM (SELECT country label,count(*)::integer count FROM responses GROUP BY country ORDER BY count DESC,country NULLS LAST LIMIT 5) entry)
      ) insights`,
      [owner, id],
    );
    return result.rows[0].insights;
  }
  async stats(owner: string, formId?: string) {
    const result = await this.db.query<{
      total: string;
      views: string;
      visitors: string;
      starts: string;
      submissions: string;
      completion: import('@linktree/types').FormCompletionPeriod;
    }>(
      `WITH ${FORM_COMPLETION_CTES} SELECT count(*) FILTER (WHERE event.event_name='page_view')::text views,
      count(DISTINCT event.visitor_id) FILTER (WHERE event.event_name='page_view')::text visitors,
      count(*) FILTER (WHERE event.event_name='form_view')::text starts,
      (SELECT coalesce(sum(submission_count),0)::text FROM forms WHERE business_id=$1 AND ($2::uuid IS NULL OR id=$2)) submissions,
      (SELECT count(*)::text FROM forms WHERE business_id=$1 AND ($2::uuid IS NULL OR id=$2)) total,
      (SELECT jsonb_build_object('from',period.from_at,'to',period.to_at,'starts',completion.starts,'responses',completion.responses,'rate',completion.rate) FROM period,completion) completion
      FROM owned_events event`,
      [owner, formId ?? null],
    );
    const row = result.rows[0];
    return {
      completion: row.completion,
      totalForms: Number(row.total),
      views: Number(row.views),
      visitors: Number(row.visitors),
      starts: Number(row.starts),
      submissions: Number(row.submissions),
    };
  }
}
