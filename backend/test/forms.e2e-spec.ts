import { PublicService } from '../src/public/public.service';
import type { RedisService } from '../src/redis/redis.service';
import type { PublicPageAnalyticsService } from '../src/analytics/public-page-analytics.service';
import { Pool, type PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PRIVACY_VERSION } from '../src/common/legal-versions';
import type { FormDraft } from '@linktree/types';
import { readBaselineSql } from '../src/database/baseline';
import { FormsService } from '../src/forms/forms.service';
import { DatabaseService } from '../src/database/database.service';
import { PlatformContentWorkspaceService } from '../src/platform-workspace/platform-content-workspace.service';
import { StorageService } from '../src/storage/storage.service';
import { UnifiedAnalyticsService } from '../src/analytics/unified-analytics.service';
const databaseName = `sponsor_krd_forms_e2e_${process.pid}`;
function connection(database: string) {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
  };
}
const fixture = (): FormDraft => ({
  id: randomUUID(),
  name: 'Contact',
  headline: 'Contact',
  status: 'paused',
  layout: 'form',
  language: 'en',
  appearance: 'light',
  description: '',
  purpose: '',
  banner: '',
  logo: '',
  blocks: [],
  questions: [
    { id: 'phone', type: 'phone', label: 'Phone', required: true, options: [] },
  ],
  consentRequired: true,
  finalTitle: 'Thanks',
  finalDescription: '',
  buttonText: '',
  buttonUrl: '',
  updatedAt: new Date().toISOString(),
  actions: [
    {
      id: 'website',
      type: 'website',
      text: 'Website',
      url: 'https://example.com',
    },
  ],
});
const context = {
  ip: '127.0.0.1',
  userAgent: 'Mozilla/5.0 Chrome/120.0',
  countryCode: 'IQ',
};
describe('durable forms and shared analytics (PostgreSQL)', () => {
  jest.setTimeout(60000);
  let maintenance: Pool;
  let pool: Pool;
  let forms: FormsService;
  let analytics: UnifiedAnalyticsService;
  let ownerA: string;
  let ownerB: string;
  let platformOwner: string;
  beforeAll(async () => {
    if (!/^sponsor_krd_forms_e2e_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool(
      connection(process.env.DB_MAINTENANCE_NAME || 'postgres'),
    );
    await maintenance.query(
      `CREATE DATABASE "${databaseName}" WITH TEMPLATE template0 ENCODING 'UTF8'`,
    );
    pool = new Pool(connection(databaseName));
    await pool.query(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    const db = {
      query: pool.query.bind(pool),
      transaction: async <T>(callback: (client: PoolClient) => Promise<T>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await callback(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    } as unknown as DatabaseService;
    analytics = new UnifiedAnalyticsService(
      db,
      new ConfigService({
        ANALYTICS_HASH_SECRET:
          'forms-test-hmac-secret-with-more-than-32-characters',
      }),
    );
    platformOwner = (
      await pool.query<{ id: string }>(
        "SELECT id FROM businesses WHERE account_type='platform'",
      )
    ).rows[0].id;
    ownerA = (
      await pool.query<{ id: string }>(
        "INSERT INTO businesses(username,name,subdomain) VALUES('forms-a','Forms A','forms-a') RETURNING id",
      )
    ).rows[0].id;
    ownerB = (
      await pool.query<{ id: string }>(
        "INSERT INTO businesses(username,name,subdomain) VALUES('forms-b','Forms B','forms-b') RETURNING id",
      )
    ).rows[0].id;
    await pool.query(
      `UPDATE business_subscriptions s
       SET subscription_plan_id=p.id, plan_configuration_id=c.id
       FROM billing_subscription_plans p
       JOIN billing_plan_configurations c ON c.plan_id=p.permission_profile_id
       WHERE s.business_id=ANY($1::uuid[]) AND p.code='max'`,
      [[ownerA, ownerB]],
    );
    forms = new FormsService(
      db,
      {
        getWorkspaceId: async () => platformOwner,
      } as PlatformContentWorkspaceService,
      { areBusinessAssetsOwned: async () => true } as unknown as StorageService,
      analytics,
    );
  });
  afterAll(async () => {
    await pool?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });
  it('blocks public forms after downgrade while preserving their data', async () => {
    const form = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Plan access',
    });
    try {
      for (const plan of ['basic', 'pro', 'ultra']) {
        await pool.query(
          `UPDATE business_subscriptions SET subscription_plan_id=(SELECT id FROM billing_subscription_plans WHERE code=$2) WHERE business_id=$1`,
          [ownerA, plan],
        );
        await expect(
          forms.publicStatus('forms-a', form.slug!),
        ).rejects.toThrow();
        await expect(forms.publicForm('forms-a', form.slug!)).rejects.toThrow();
      }
    } finally {
      await pool.query(
        `UPDATE business_subscriptions SET subscription_plan_id=(SELECT id FROM billing_subscription_plans WHERE code='max') WHERE business_id=$1`,
        [ownerA],
      );
    }
    expect((await forms.publicForm('forms-a', form.slug!)).form.id).toBe(
      form.id,
    );
  });
  it('discovers only useful active owner forms in the sitemap', async () => {
    const useful = await forms.create(ownerA, {
      ...fixture(),
      headline: 'SEO consultation',
      description: 'Schedule a consultation with our business team.',
    });
    const empty = await forms.create(ownerA, {
      ...fixture(),
      headline: 'SEO empty',
      description: '',
    });
    const paused = await forms.create(ownerA, {
      ...fixture(),
      headline: 'SEO paused',
      description: 'This consultation is currently unavailable.',
    });
    await forms.status(ownerA, paused.id, 'paused');
    const service = new PublicService(
      { query: pool.query.bind(pool) } as unknown as DatabaseService,
      {} as RedisService,
      {} as PublicPageAnalyticsService,
      {
        getWorkspaceId: async () => platformOwner,
      } as PlatformContentWorkspaceService,
    );
    await pool.query(
      'UPDATE business_branding SET logo=$2 WHERE business_id=$1',
      [ownerA, '/images/upload/businesses/owner-a/logo.png'],
    );
    const branding = await pool.query<{ logo: string }>(
      'SELECT logo FROM business_branding WHERE business_id=$1',
      [ownerA],
    );
    expect((await forms.publicForm('forms-a', useful.slug!)).businessLogo).toBe(
      branding.rows[0]?.logo ?? null,
    );
    const result = await service.getSitemapPages('forms-a', 0);
    expect(result.pages).toContainEqual(
      expect.objectContaining({ slug: useful.slug, pageType: 'form' }),
    );
    expect(
      result.pages.some(
        (page) => page.slug === empty.slug || page.slug === paused.slug,
      ),
    ).toBe(false);
    expect(
      (await service.getSitemapPages('forms-b', 0)).pages.some(
        (page) => page.slug === useful.slug,
      ),
    ).toBe(false);
  });
  it('matches retained sessions to saved responses and summarizes choice answers', async () => {
    const form = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Analytics insights',
      questions: [
        ...fixture().questions,
        {
          id: 'contact',
          type: 'choice',
          label: 'Preferred contact',
          required: false,
          options: ['Phone', 'Email'],
        },
      ],
    });
    expect((await forms.stats(ownerA, form.id)).completion).toMatchObject({
      starts: 0,
      responses: 0,
      rate: null,
    });
    const start = async (sessionId: string) =>
      analytics.ingest(
        {
          eventId: randomUUID(),
          pageId: form.id,
          eventName: 'form_view',
          visitorId: 'insights-visitor',
          sessionId,
          occurredAt: new Date().toISOString(),
          pageUrl:
            'https://forms-a.localhost/form/analytics-insights?utm_source=newsletter',
        },
        context,
      );
    await start('insights-complete');
    await start('insights-complete');
    await start('insights-abandoned');
    await analytics.ingest(
      {
        eventId: randomUUID(),
        pageId: form.id,
        eventName: 'form_view',
        visitorId: 'insights-bot',
        sessionId: 'insights-bot',
        occurredAt: new Date().toISOString(),
      },
      { ...context, userAgent: 'Googlebot' },
    );
    const submit = async (sessionId: string, choice: string) =>
      forms.submit(
        'forms-a',
        form.slug!,
        {
          requestId: randomUUID(),
          revision: form.revision,
          privacyVersion: PRIVACY_VERSION,
          consent: true,
          answers: { phone: '7501234567', contact: choice },
          phoneCountryCodes: { phone: '964' },
          tracking: {
            visitorId: 'insights-visitor',
            sessionId,
            pageUrl:
              'https://forms-a.localhost/form/analytics-insights?utm_source=newsletter',
          },
        },
        context,
      );
    await submit('insights-complete', 'Phone');
    const old = await submit('insights-old', 'Email');
    await pool.query(
      "UPDATE analytics_events SET occurred_at=now()-interval '90 days' WHERE id=(SELECT analytics_event_id FROM form_submissions WHERE id=$1)",
      [old.id],
    );
    await pool.query(
      "UPDATE form_submissions SET created_at=now()-interval '90 days' WHERE id=$1",
      [old.id],
    );
    // Tracking-only conversions cannot count without an accepted response.
    await pool.query(
      `INSERT INTO analytics_events(event_id,business_id,public_page_id,visitor_id,session_id,event_name,occurred_at,is_bot)
      SELECT $2,business_id,public_page_id,visitor_id,session_id,'form_submit',now(),false FROM analytics_events WHERE event_name='form_view' AND public_page_id=(SELECT id FROM public_pages WHERE source_form_id=$1) ORDER BY occurred_at DESC LIMIT 1`,
      [form.id, randomUUID()],
    );
    const insights = await forms.getAnalytics(ownerA, form.id);
    expect(insights.submissions).toBe(2);
    expect(insights.completion).toMatchObject({
      starts: 2,
      responses: 1,
      rate: 50,
    });
    expect(insights.insights?.sourcePerformance).toEqual([
      { label: 'newsletter', starts: 2, responses: 1, rate: 50 },
    ]);
    expect(insights.insights?.answerSummaries).toEqual([
      {
        questionId: 'contact',
        label: 'Preferred contact',
        totalAnswers: 2,
        options: [
          { label: 'Phone', count: 1, percentage: 50 },
          { label: 'Email', count: 1, percentage: 50 },
        ],
      },
    ]);
    await pool.query(
      "UPDATE forms SET definition=jsonb_set(definition,'{questions,1,options}',$3::jsonb) WHERE id=$1 AND business_id=$2",
      [form.id, ownerA, JSON.stringify(['Phone', 'SMS'])],
    );
    expect(
      (await forms.getAnalytics(ownerA, form.id)).insights?.answerSummaries?.[0]
        .options,
    ).toEqual([
      { label: 'Phone', count: 1, percentage: 50 },
      { label: 'SMS', count: 0, percentage: 0 },
      { label: null, count: 1, percentage: 50 },
    ]);
    // Expired tracking cannot make lifetime responses inflate the rate.
    await pool.query(
      "UPDATE analytics_events SET occurred_at=now()-interval '90 days' WHERE public_page_id=(SELECT id FROM public_pages WHERE source_form_id=$1) AND event_name='form_view'",
      [form.id],
    );
    expect(
      (await forms.getAnalytics(ownerA, form.id)).completion,
    ).toMatchObject({ starts: 0, responses: 0, rate: null });
    await expect(forms.getAnalytics(ownerB, form.id)).rejects.toThrow();
  });
  it('allocates concurrent headline slugs per tenant and protects cross-tenant reads and writes', async () => {
    const [a, b] = await Promise.all([
      forms.create(ownerA, fixture()),
      forms.create(ownerA, fixture()),
    ]);
    expect(new Set([a.slug, b.slug])).toEqual(
      new Set(['contact', 'contact-2']),
    );
    await expect(forms.status(ownerA, a.id, ['active'])).rejects.toThrow(
      'Invalid form status',
    );
    const other = await forms.create(ownerB, fixture());
    expect(other.slug).toBe('contact');
    await expect(forms.get(ownerB, a.id)).rejects.toThrow('Form not found');
    await expect(forms.delete(ownerB, a.id)).rejects.toThrow('Form not found');
    const publicA = await forms.publicForm('forms-a', a.slug!);
    expect(publicA.form.id).toBe(a.id);
    expect(publicA.form).not.toHaveProperty('submissionCount');
    expect(await forms.publicStatus('forms-a', a.slug!)).toEqual({
      slug: a.slug,
    });
    expect(publicA.analytics.pixelIds).toEqual([]);
    expect(publicA.analytics.actions['form:submit']).toBeDefined();
    expect(publicA.analytics.actions['form:start']).toBeDefined();
    expect(publicA.analytics.actions['form:return']).toBeDefined();
    const edited = await forms.update(ownerA, a.id, {
      ...a,
      headline: 'New title',
    });
    expect(edited.name).toBe('New title');
    expect(edited.slug).toBe(a.slug);
    expect(edited.revision).toBe(2);
    await expect(forms.update(ownerA, a.id, a)).rejects.toThrow('changed');
  });
  it('keeps archive independent of activation, public access, and response history', async () => {
    const incomplete = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Incomplete',
      questions: [
        {
          id: 'choice',
          type: 'choice',
          label: '',
          required: true,
          options: ['', ''],
        },
      ],
    });
    expect(incomplete.status).toBe('paused');
    await expect(
      forms.status(ownerA, incomplete.id, 'active'),
    ).rejects.toThrow();
    await expect(
      forms.publicForm('forms-a', incomplete.slug!),
    ).rejects.toThrow();
    for (const currentStatus of ['active', 'paused'] as const) {
      const form = await forms.create(ownerA, {
        ...fixture(),
        headline: `Archive ${currentStatus}`,
      });
      await forms.status(ownerA, form.id, currentStatus);
      const archived = await forms.archive(ownerA, form.id, true);
      expect(archived.status).toBe(currentStatus);
      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeTruthy();
      expect((await forms.list(ownerA, 0, form.name)).items).toHaveLength(0);
      expect(
        (await forms.list(ownerA, 0, form.name, true)).items[0],
      ).toMatchObject({ status: currentStatus, isArchived: true });
      if (currentStatus === 'active') {
        expect((await forms.publicForm('forms-a', form.slug!)).form.id).toBe(
          form.id,
        );
        expect(await forms.publicStatus('forms-a', form.slug!)).toEqual({
          slug: form.slug,
        });
        await forms.submit(
          'forms-a',
          form.slug!,
          {
            requestId: randomUUID(),
            revision: form.revision,
            privacyVersion: PRIVACY_VERSION,
            consent: true,
            answers: { phone: '7501234567' },
            phoneCountryCodes: { phone: '964' },
            tracking: {
              visitorId: 'forms-archive-visitor',
              sessionId: 'forms-archive-session',
            },
          },
          context,
        );
        expect((await forms.submissions(ownerA, form.id, 0)).total).toBe(1);
      } else
        await expect(forms.publicForm('forms-a', form.slug!)).rejects.toThrow();
      const edited = await forms.update(ownerA, form.id, {
        ...archived,
        headline: form.name + ' updated',
        isArchived: false,
      });
      expect(edited.isArchived).toBe(true);
      expect(edited.status).toBe(currentStatus);
      const restored = await forms.archive(ownerA, form.id, false);
      expect(restored).toMatchObject({
        status: currentStatus,
        isArchived: false,
        archivedAt: null,
      });
      await expect(forms.archive(ownerB, form.id, true)).rejects.toThrow(
        'Form not found',
      );
      await expect(forms.archive(ownerA, form.id, 'true')).rejects.toThrow(
        'Invalid archive value',
      );
    }
    await expect(
      forms.status(ownerA, incomplete.id, 'archived'),
    ).rejects.toThrow('Invalid form status');
    await expect(forms.status(ownerA, incomplete.id, 'draft')).rejects.toThrow(
      'Invalid form status',
    );
  });
  it('can pause and activate a form while it remains archived', async () => {
    const form = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Archived controls',
    });
    await forms.archive(ownerA, form.id, true);
    expect(await forms.status(ownerA, form.id, 'paused')).toMatchObject({
      status: 'paused',
      isArchived: true,
    });
    await expect(forms.publicStatus('forms-a', form.slug!)).rejects.toThrow();
    expect(await forms.status(ownerA, form.id, 'active')).toMatchObject({
      status: 'active',
      isArchived: true,
    });
    expect(await forms.publicStatus('forms-a', form.slug!)).toEqual({
      slug: form.slug,
    });
  });
  it('migrates legacy modes without republishing old archived or incomplete forms', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DROP TRIGGER forms_public_page_sync ON public.forms');
      await client.query(
        'ALTER TABLE public.forms DROP CONSTRAINT forms_status_check, DROP COLUMN is_archived, DROP COLUMN archived_at',
      );
      for (const status of ['ready', 'draft', 'archived'])
        await client.query(
          'INSERT INTO forms(business_id,slug,name,status,definition) VALUES($1,$2,$3,$4,$5::jsonb)',
          [
            ownerA,
            'legacy-' + status,
            'Legacy ' + status,
            status,
            JSON.stringify(fixture()),
          ],
        );
      await client.query(
        'CREATE TRIGGER forms_public_page_sync AFTER INSERT OR UPDATE OF definition,status,name,revision ON public.forms FOR EACH ROW EXECUTE FUNCTION public.sync_form_public_page()',
      );
      const sql = readFileSync(
        join(
          __dirname,
          '../src/database/migrations/2026-10-10_forms_visibility.sql',
        ),
        'utf8',
      );
      await client.query(sql);
      await client.query(sql);
      const rows = await client.query(
        "SELECT slug,status,is_archived FROM forms WHERE slug LIKE 'legacy-%' ORDER BY slug",
      );
      expect(rows.rows).toEqual([
        { slug: 'legacy-archived', status: 'paused', is_archived: true },
        { slug: 'legacy-draft', status: 'paused', is_archived: false },
        { slug: 'legacy-ready', status: 'active', is_archived: false },
      ]);
      const pages = await client.query<{ slug: string; status: string }>(
        "SELECT slug,status FROM public_pages WHERE business_id=$1 AND slug LIKE 'legacy-%' ORDER BY slug",
        [ownerA],
      );
      expect(pages.rows.map((row) => row.status)).toEqual([
        'paused',
        'paused',
        'published',
      ]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
  it('paginates summaries, filters archived forms and treats wildcard search as literal text', async () => {
    const entries = [];
    for (let i = 0; i < 22; i++)
      entries.push(
        await forms.create(ownerB, {
          ...fixture(),
          headline: `Paged item ${i}`,
        }),
      );
    const first = await forms.list(ownerB, 0, 'Paged item');
    expect(first.total).toBe(22);
    expect(first.items).toHaveLength(20);
    expect(first.items[0]).not.toHaveProperty('questions');
    expect(first.items[0].questionCount).toBe(1);
    expect((await forms.list(ownerB, 1, 'Paged item')).items).toHaveLength(2);
    await forms.archive(ownerB, entries[0].id, true);
    expect((await forms.list(ownerB, 0, 'Paged item')).total).toBe(21);
    expect((await forms.list(ownerB, 0, 'Paged item', true)).total).toBe(1);
    await forms.create(ownerB, { ...fixture(), headline: 'Literal 100%_sale' });
    expect((await forms.list(ownerB, 0, '%_')).total).toBe(1);
    expect((await forms.list(ownerA, 0, '%_')).total).toBe(0);
  });
  it('filters and pages hundreds of responses with a stable export cutoff and owner isolation', async () => {
    const form = await forms.create(ownerB, {
      ...fixture(),
      headline: 'Response report',
    });
    await pool.query(
      `INSERT INTO form_submissions(form_id,request_id,revision,answers,consent,duration_ms,created_at)
      SELECT $1,gen_random_uuid(),1,jsonb_build_array(jsonb_build_object('questionId','phone','label','Phone','value','Customer '||n)),true,1000,'2026-10-05T10:00:00Z'::timestamptz + n * interval '1 second' FROM generate_series(1,201) n`,
      [form.id],
    );
    const first = await forms.submissions(ownerB, form.id, 0, {
      q: 'customer',
      pageSize: 100,
      from: '2026-10-05',
      to: '2026-10-05',
    });
    expect(first.items).toHaveLength(100);
    expect(first.total).toBe(201);
    await pool.query(
      `INSERT INTO form_submissions(form_id,request_id,revision,answers,consent,created_at) VALUES($1,gen_random_uuid(),1,'[{"questionId":"phone","label":"Phone","value":"Customer new"}]',true,$2::timestamptz + interval '1 millisecond')`,
      [form.id, first.snapshotAt],
    );
    const second = await forms.submissions(ownerB, form.id, 1, {
      q: 'customer',
      pageSize: 100,
      before: first.snapshotAt,
    });
    const third = await forms.submissions(ownerB, form.id, 2, {
      q: 'customer',
      pageSize: 100,
      before: first.snapshotAt,
    });
    expect(second.total).toBe(201);
    expect(second.items).toHaveLength(100);
    expect(third.items).toHaveLength(1);
    expect(
      new Set(
        [...first.items, ...second.items, ...third.items].map(
          (response) => response.id,
        ),
      ).size,
    ).toBe(201);
    expect(
      (await forms.submissions(ownerB, form.id, 0, { q: '%_' })).total,
    ).toBe(0);
    await expect(
      forms.submissions(ownerA, form.id, 0, { pageSize: 100 }),
    ).rejects.toThrow('Form not found');
  });
  it('rolls back the response and counter if conversion recording fails', async () => {
    const form = await forms.create(ownerB, {
      ...fixture(),
      headline: 'Atomic response',
    });
    const body = {
      privacyVersion: PRIVACY_VERSION,
      requestId: randomUUID(),
      revision: 1,
      consent: true,
      answers: { phone: '7501234567' },
      phoneCountryCodes: { phone: '964' },
      tracking: { visitorId: 'atomic-visitor', sessionId: 'atomic-session' },
    };
    const failure = jest
      .spyOn(analytics, 'ingest')
      .mockRejectedValueOnce(new Error('analytics unavailable'));
    await expect(
      forms.submit('forms-b', form.slug!, body, context),
    ).rejects.toThrow('analytics unavailable');
    expect((await forms.get(ownerB, form.id)).submissionCount).toBe(0);
    expect((await forms.submissions(ownerB, form.id, 0)).total).toBe(0);
    failure.mockRestore();
    await forms.submit('forms-b', form.slug!, body, context);
    expect((await forms.get(ownerB, form.id)).submissionCount).toBe(1);
  });
  it('persists responses and conversions atomically, deduplicates retries and reports attribution without contact data', async () => {
    const previousMetrics = await forms.stats(ownerA);
    const form = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Response',
    });
    const requestId = randomUUID();
    const body = {
      requestId,
      privacyVersion: PRIVACY_VERSION,
      durationMs: 12345,
      revision: form.revision,
      consent: true,
      answers: { phone: '7501234567' },
      phoneCountryCodes: { phone: '964' },
      tracking: {
        visitorId: 'forms-visitor',
        sessionId: 'forms-session',
        pageUrl:
          'https://forms-a.localhost/form/response?utm_source=newsletter&utm_campaign=test',
        referrer: 'https://example.com',
      },
    };
    await analytics.ingest(
      {
        eventId: randomUUID(),
        pageId: form.id,
        eventName: 'page_view',
        visitorId: 'forms-visitor',
        sessionId: 'forms-session',
        occurredAt: new Date().toISOString(),
      },
      context,
    );
    await analytics.ingest(
      {
        eventId: randomUUID(),
        pageId: form.id,
        eventName: 'form_view',
        visitorId: 'forms-visitor',
        sessionId: 'forms-session',
        occurredAt: new Date().toISOString(),
      },
      context,
    );
    const [first, retry] = await Promise.all([
      forms.submit('forms-a', form.slug!, body, context),
      forms.submit('forms-a', form.slug!, body, context),
    ]);
    expect(retry.id).toBe(first.id);
    expect((await forms.get(ownerA, form.id)).submissionCount).toBe(1);
    expect(
      (await forms.submissions(ownerA, form.id, 0)).items[0].answers[0].value,
    ).toBe('+9647501234567');
    expect(
      (await forms.submissions(ownerA, form.id, 0)).items[0],
    ).toMatchObject({
      durationMs: 12345,
      privacyVersion: PRIVACY_VERSION,
      attribution: { source: 'newsletter', campaign: 'test', country: 'IQ' },
    });
    expect(
      (
        await forms.submissions(ownerA, form.id, 0, {
          q: '750123',
          pageSize: 100,
        })
      ).total,
    ).toBe(1);
    expect(
      (await forms.submissions(ownerA, form.id, 0, { q: 'newsletter' })).total,
    ).toBe(1);
    expect(
      (await forms.submissions(ownerA, form.id, 0, { q: '%_' })).total,
    ).toBe(0);
    expect(
      (
        await forms.submissions(ownerA, form.id, 0, {
          from: '2000-01-01',
          to: '2000-01-02',
        })
      ).total,
    ).toBe(0);
    await expect(
      forms.submissions(ownerA, form.id, 0, {
        from: '2026-10-10',
        to: '2026-10-01',
      }),
    ).rejects.toThrow('Invalid date range');
    const snapshot = await forms.submissions(ownerA, form.id, 0);
    expect(snapshot.snapshotAt).toBeDefined();
    await expect(forms.submissions(ownerB, form.id, 0)).rejects.toThrow();
    const event = (
      await pool.query<{ utm_source: string; properties: unknown }>(
        'SELECT utm_source,properties FROM analytics_events WHERE event_id=$1',
        [requestId],
      )
    ).rows[0];
    expect(event.utm_source).toBe('newsletter');
    expect(JSON.stringify(event.properties)).not.toContain('7501234567');
    expect(
      (
        await pool.query(
          'SELECT * FROM marketing_event_outbox WHERE external_event_id=$1',
          [requestId],
        )
      ).rowCount,
    ).toBe(0);
    expect(await forms.getAnalytics(ownerA, form.id)).toMatchObject({
      total_views: 1,
      unique_views: 1,
      views: 1,
      visitors: 1,
      starts: 1,
      submissions: 1,
      insights: {
        averageDurationMs: 12345,
        sources: [{ label: 'newsletter', count: 1 }],
        countries: [{ label: 'IQ', count: 1 }],
      },
    });
    expect(
      (await forms.getAnalytics(ownerA, form.id)).insights?.daily,
    ).toHaveLength(14);
    const listed = (await forms.list(ownerA, 0, form.name)).items.find(
      (item) => item.id === form.id,
    );
    expect(listed).toMatchObject({
      views: 1,
      interactions: 1,
      description: form.description,
    });
    expect(listed?.createdAt).toBeDefined();
    expect(
      (await forms.list(ownerB, 0, form.name)).items.some(
        (item) => item.id === form.id,
      ),
    ).toBe(false);
    await expect(forms.getAnalytics(ownerB, form.id)).rejects.toThrow(
      'Form not found',
    );
    const metrics = await forms.stats(ownerA);
    expect(metrics).toMatchObject({
      views: 1,
      visitors: 1,
      starts: previousMetrics.starts + 1,
      submissions: previousMetrics.submissions + 1,
    });
    await forms.update(ownerA, form.id, {
      ...form,
      questions: [
        {
          id: 'new',
          type: 'short',
          label: 'Changed',
          required: true,
          options: [],
        },
      ],
    });
    expect((await forms.submit('forms-a', form.slug!, body, context)).id).toBe(
      first.id,
    );
    await expect(
      forms.submit(
        'forms-a',
        form.slug!,
        { ...body, requestId: randomUUID() },
        context,
      ),
    ).rejects.toThrow();
    await forms.status(ownerA, form.id, 'paused');
    await expect(forms.publicStatus('forms-a', form.slug!)).rejects.toThrow(
      'Form not found',
    );
    await expect(
      forms.submit('forms-a', form.slug!, body, context),
    ).rejects.toThrow();
    await forms.delete(ownerA, form.id);
    expect(
      (
        await pool.query('SELECT * FROM form_submissions WHERE id=$1', [
          first.id,
        ])
      ).rowCount,
    ).toBe(0);
  });
  it('publishes platform forms on the root and rejects suspended owners', async () => {
    const root = await forms.create(platformOwner, {
      ...fixture(),
      headline: 'Root form',
      layout: 'card',
    });
    expect((await forms.publicForm('', root.slug!)).form.layout).toBe('card');
    expect((await forms.publicForm('', root.slug!)).analytics.pixelIds).toEqual(
      [],
    );
    await pool.query("UPDATE businesses SET status='suspended' WHERE id=$1", [
      ownerB,
    ]);
    await expect(forms.publicForm('forms-b', 'contact')).rejects.toThrow();
  });
  it('clears owned form tracking and responses, preserves shared identities and allows new submissions', async () => {
    await pool.query("UPDATE businesses SET status='active' WHERE id=$1", [
      ownerB,
    ]);
    const first = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Clear answers',
      status: 'active',
    });
    const other = await forms.create(ownerB, {
      ...fixture(),
      headline: 'Keep answers',
      status: 'active',
    });
    const input = (revision: number) => ({
      requestId: randomUUID(),
      revision,
      privacyVersion: PRIVACY_VERSION,
      consent: true,
      answers: { phone: '7501234567' },
      phoneCountryCodes: { phone: '964' },
      tracking: { visitorId: 'clear-visitor', sessionId: 'clear-session' },
    });
    await forms.submit('forms-a', first.slug!, input(first.revision!), context);
    await forms.submit('forms-a', first.slug!, input(first.revision!), context);
    await forms.submit('forms-b', other.slug!, input(other.revision!), context);
    await expect(forms.deleteSubmissions(ownerB, first.id)).rejects.toThrow(
      'Form not found',
    );
    expect((await forms.submissions(ownerA, first.id, 0)).total).toBe(2);
    const shared = await forms.create(ownerA, {
      ...fixture(),
      headline: 'Keep shared visitor',
      status: 'active',
    });
    await forms.submit(
      'forms-a',
      shared.slug!,
      input(shared.revision!),
      context,
    );
    const visitorEvents: string[] = [];
    for (const eventName of ['page_view', 'form_view'] as const) {
      const eventId = randomUUID();
      visitorEvents.push(eventId);
      await analytics.ingest(
        {
          eventId,
          pageId: first.id,
          eventName,
          occurredAt: new Date().toISOString(),
          visitorId: 'clear-only-visitor',
          sessionId: 'clear-only-session',
        },
        context,
      );
    }
    const identities = (
      await pool.query<{ visitor_id: string; session_id: string }>(
        'SELECT visitor_id,session_id FROM analytics_events WHERE event_id=$1',
        [visitorEvents[0]],
      )
    ).rows[0];
    expect(await forms.stats(ownerA, first.id)).toMatchObject({
      views: 1,
      visitors: 1,
      starts: 1,
      submissions: 2,
    });
    expect(await forms.deleteSubmissions(ownerA, first.id)).toEqual({
      deleted: 2,
    });
    expect((await forms.get(ownerA, first.id)).submissionCount).toBe(0);
    expect((await forms.get(ownerA, first.id)).revision).toBe(first.revision);
    expect((await forms.submissions(ownerB, other.id, 0)).total).toBe(1);
    expect((await forms.getAnalytics(ownerA, first.id)).submissions).toBe(0);
    expect(await forms.stats(ownerA, first.id)).toMatchObject({
      views: 0,
      visitors: 0,
      starts: 0,
      submissions: 0,
    });
    for (const table of [
      'analytics_events',
      'analytics_page_daily',
      'analytics_action_daily',
    ]) {
      expect(
        (
          await pool.query(
            `SELECT 1 FROM ${table} WHERE public_page_id=(SELECT id FROM public_pages WHERE source_form_id=$1)`,
            [first.id],
          )
        ).rowCount,
      ).toBe(0);
    }
    expect(
      (
        await pool.query('SELECT 1 FROM analytics_visitors WHERE id=$1', [
          identities.visitor_id,
        ])
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool.query('SELECT 1 FROM analytics_sessions WHERE id=$1', [
          identities.session_id,
        ])
      ).rowCount,
    ).toBe(0);
    expect((await forms.submissions(ownerA, shared.id, 0)).total).toBe(1);
    expect(
      (
        await pool.query(
          'SELECT 1 FROM analytics_events WHERE public_page_id=(SELECT id FROM public_pages WHERE source_form_id=$1)',
          [shared.id],
        )
      ).rowCount,
    ).toBe(1);
    expect(await forms.deleteSubmissions(ownerA, first.id)).toEqual({
      deleted: 0,
    });
    await forms.submit('forms-a', first.slug!, input(first.revision!), context);
    expect((await forms.get(ownerA, first.id)).submissionCount).toBe(1);
    await Promise.all([
      forms.submit('forms-a', first.slug!, input(first.revision!), context),
      forms.deleteSubmissions(ownerA, first.id),
    ]);
    expect((await forms.get(ownerA, first.id)).submissionCount).toBe(
      (await forms.submissions(ownerA, first.id, 0)).total,
    );
  });
});
