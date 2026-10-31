import { inspectLinktreeSponsor } from '@linktree/types/linktree-sponsor.cjs';
import {
  updateLinktreeInTransaction,
  type LinktreeRow,
} from './linktree-write';
import {
  normalizeTemplateConfig,
  type NormalizedTemplateConfig,
} from './linktree-template-config';
import { buildCreateLinks } from './linktree-links';
import { resolveNewPagePattern } from '@linktree/types/linktree-defaults.cjs';
import { normalizeLinktreeCreate } from './linktree-content';
import { slugifyPublicPageName as slugifyLinktreeName } from '../common/public-page-slug';
export { slugifyLinktreeName };
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { QueryResult, QueryResultRow } from 'pg';
import {
  readLinktreeBanner,
  LINKTREE_BANNER_KEY,
} from '@linktree/types/linktree-banner.cjs';
import {
  syncWhatsAppQuestions,
  type WhatsappQuestionInput,
} from './sync-whatsapp-questions';
import {
  assertLinktreeBannerOwnership,
  assertLinktreeMediaOwnership,
} from '../common/linktree-banner';
import { assertLinktreeSeoPlan } from '../common/linktree-seo';
import { publicLinktreeCacheKeys } from '../common/root-public-cache';
import { DatabaseService } from '../database/database.service';
import {
  withLinkMetadata,
  type LinkRow,
  type MappedLink,
} from '../links/link.types';
import { describeError } from '../common/describe-error';
import {
  BACKGROUND_IMAGE_CONFIG_KEY,
  isLinktreeBackgroundImage,
} from '../common/linktree-background-image';
import { BACKGROUND_PATTERN_CONFIG_KEY } from '../common/linktree-background-pattern';
import { ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateLinktreeDto } from './dto/create-linktree.dto';
import { UpdateLinktreeDto } from './dto/update-linktree.dto';
import { DuplicateLinktreeDto } from './dto/duplicate-linktree.dto';
import * as crypto from 'crypto';
import { EntitlementService } from '../billing/entitlement.service';
import { TemplateAccessService } from '../billing/template-access.service';
import { StorageService } from '../storage/storage.service';
import {
  AnalyticsReadRepository,
  type LinktreeAnalyticsTotals,
} from '../analytics/analytics-read.repository';
import type { SyncLinkInput } from '../links/link.types';
import {
  DEFAULT_LINKTREE_BACKGROUND_COLOR,
  DEFAULT_LINKTREE_DESCRIPTION,
  DEFAULT_LINKTREE_FOOTER_PHONE,
  DEFAULT_LINKTREE_FOOTER_HIDDEN,
  DEFAULT_LINKTREE_FOOTER_TEXT,
  DEFAULT_LINKTREE_SUBTITLE,
  DEFAULT_LINKTREE_TEMPLATE_KEY,
  DEFAULT_LINKTREE_WHATSAPP_MODAL_SUBTITLE,
  DEFAULT_LINKTREE_WHATSAPP_MODAL_TITLE,
  DEFAULT_LINKTREE_WHATSAPP_QUESTIONS,
  DEFAULT_LINKTREE_WHATSAPP_ENABLED,
} from '../common/linktree-defaults';

/**
 * Row shapes for the linktree queries.
 *
 * Type aliases rather than interfaces: pg constrains the row generic to
 * `QueryResultRow`, and only aliases pick up the implicit index signature.
 */

type BusinessDefaultsRow = {
  name?: string;
  logo?: string | null;
  website_color?: string | null;
  default_avatar?: string | null;
  default_template: string | null;
  default_background_color: string | null;
  default_background_pattern?: string | null;
  default_footer_text: string | null;
  default_footer_phone: string | null;
  default_footer_hidden: boolean | null;
  default_whatsapp_enabled: boolean | null;
};

type MappedLinktree = Omit<LinktreeRow, 'template_config'> & {
  template_config: NormalizedTemplateConfig;
  headline: string;
  slogan: string | null;
  slogan_color: string | null;
  logo: string | null;
};

type WhatsappQuestionRow = {
  video_url?: string | null;
  id: string;
  text: string;
  message: string | null;
};

/** Both DatabaseService and a pooled client expose this much of the API. */
type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
};

type LinktreeWriteScope = 'business' | 'platform';

/**
 * The two buttons a default page starts with, built from the business's own
 * registered phone number.
 *
 * A default page with no way to contact the business is a page with nothing on
 * it, and the number is already required at signup — so the one thing every
 * business can be given without asking is a way to be reached.
 *
 * `original_input` and `country_code` are deliberately left unset. Splitting the
 * number into a dialling code and a local part needs the country list, which
 * lives in the link editor on the frontend; the editor already falls back to
 * parsing both back out of the URL when the metadata is absent, so a seeded
 * link opens for editing exactly like a hand-made one. Copying that list into
 * the backend would be a second source of truth for no gain.
 */
export function defaultContactLinks(phone: string | null): SyncLinkInput[] {
  const dialable = internationalPhone(phone);
  if (!dialable) return [];
  return [
    { platform: 'whatsapp', url: `https://wa.me/${dialable}` },
    { platform: 'phone', url: `tel:+${dialable}` },
  ];
}

/**
 * The default dialling code, matching the fallback the rest of the backend
 * uses for a phone with no country attached.
 */
const DEFAULT_DIALLING_CODE = '964';

/**
 * A registered phone as a number WhatsApp and a dialler will actually accept.
 *
 * `businesses.phone` is a single column with no country code beside it, and
 * businesses register a local number — the seeded demo business is
 * `7502485829`. `wa.me/7502485829` resolves to nobody, so seeding the raw value
 * would produce a button that silently fails, which is worse than no button.
 *
 * Mirrors what the link editor's `formatPhoneNumber` does with the country
 * picker set: drop leading zeros, keep a number that already carries a code,
 * otherwise prepend the default one. A number long enough to already be
 * international is left alone rather than having a second code stacked on it.
 */
function internationalPhone(phone: string | null): string {
  const digits = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
  // Shorter than any real number: nothing usable to dial or message.
  if (digits.length < 8) return '';
  if (digits.startsWith(DEFAULT_DIALLING_CODE)) return digits;
  // Long enough to already carry some other country's code.
  if (digits.length >= 11) return digits;
  return `${DEFAULT_DIALLING_CODE}${digits}`;
}

@Injectable()
export class LinktreesService {
  private readonly logger = new Logger(LinktreesService.name);
  private readonly uidAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789-';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly entitlementService: EntitlementService,
    private readonly templateAccessService: TemplateAccessService,
    private readonly storage: StorageService,
    private readonly analyticsRead: AnalyticsReadRepository,
  ) {}

  private async ensureTemplateAllowed(businessId: string, templateKey: string) {
    await this.templateAccessService.assertAllowed(businessId, templateKey);
  }

  private generateUid(randomLength = 21): string {
    let result = '';
    const bytes = crypto.randomBytes(randomLength);
    for (let i = 0; i < randomLength; i++) {
      result += this.uidAlphabet[bytes[i] % this.uidAlphabet.length];
    }
    return 'lt-' + result;
  }

  private normalizeTemplateConfig = normalizeTemplateConfig;

  private async mapLinktreeRow(
    clientOrDb: Queryable,
    row: LinktreeRow,
  ): Promise<MappedLinktree> {
    const qRes = await clientOrDb.query<WhatsappQuestionRow>(
      `SELECT id, question_text AS text, message, video_url FROM whatsapp_questions
       WHERE linktree_id = $1
       ORDER BY display_order ASC`,
      [row.id],
    );

    const config = this.normalizeTemplateConfig(
      row.template_config,
      row.template_key,
    );
    const modal = config.whatsapp_modal ?? {};
    config.whatsapp_modal = {
      ...modal,
      enabled: row.whatsapp_modal_enabled ?? !!modal.enabled,
      title: modal.title || 'Contact us',
      subtitle: modal.subtitle || 'Choose a question',
      questions: qRes.rows.map((q) => ({
        id: q.id,
        text: q.text,
        message: q.message,
        videoUrl: q.video_url ?? undefined,
      })),
    };

    return {
      ...row,
      headline: row.name,
      slogan: row.subtitle,
      slogan_color: row.subtitle_color,
      logo: row.image,
      template_config: config,
    };
  }

  private mapLinkRow(row: LinkRow): MappedLink {
    return withLinkMetadata(row);
  }

  private buildCreateLinks = buildCreateLinks;
  async getAllLinktrees(businessId: string) {
    const res = await this.databaseService.query<LinktreeRow>(
      `SELECT lt.id, lt.headline AS name, lt.slogan AS subtitle, lt.slogan_color AS subtitle_color, lt.description, lt.seo_name, lt.uid, lt.logo AS image, lt.background_color,
              lt.template_key, lt.template_config, lt.whatsapp_modal_enabled,
              lt.footer_text, lt.footer_phone, lt.footer_hidden, lt.status, lt.is_pinned, lt.is_archived, lt.archived_at, lt.is_default,
              lt.created_at, lt.updated_at, b.default_avatar AS business_default_avatar
       FROM linktrees lt
       LEFT JOIN business_branding b ON b.business_id = lt.business_id
       WHERE lt.business_id = $1
       ORDER BY lt.is_pinned DESC, lt.is_default DESC, lt.created_at DESC, lt.id`,
      [businessId],
    );
    const mappedRows: MappedLinktree[] = [];
    for (const row of res.rows)
      mappedRows.push(await this.mapLinktreeRow(this.databaseService, row));

    // One aggregate for the whole list rather than a query per card. A page
    // with no traffic yet has no row, so it reads as zeroes instead of being
    // left without an `analytics` object the card would have to special-case.
    //
    // Traffic is supplementary to this screen: an owner must still be able to
    // see, open and edit their pages when the analytics tables are unavailable,
    // so a failure here degrades to zeroes rather than failing the whole list.
    let totals = new Map<string, LinktreeAnalyticsTotals>();
    try {
      totals = await this.analyticsRead.linktreeTotalsForBusiness(businessId);
    } catch (error) {
      this.logger.error(
        `Linktree traffic totals unavailable for business ${businessId}: ${describeError(error)}`,
      );
    }
    return mappedRows.map((row) => ({
      ...row,
      analytics: totals.get(row.id) ?? {
        unique_views: 0,
        unique_clicks: 0,
        total_clicks: 0,
      },
    }));
  }

  async getLinktreeById(id: string, businessId: string) {
    const res = await this.databaseService.query<LinktreeRow>(
      `SELECT lt.id, lt.headline AS name, lt.slogan AS subtitle, lt.slogan_color AS subtitle_color, lt.description, lt.seo_name, lt.uid, lt.logo AS image, lt.background_color,
              lt.template_key, lt.template_config, lt.whatsapp_modal_enabled,
              lt.footer_text, lt.footer_phone, lt.footer_hidden, lt.status, lt.is_pinned, lt.is_archived, lt.archived_at, lt.is_default,
              lt.created_at, lt.updated_at, b.default_avatar AS business_default_avatar
       FROM linktrees lt
       LEFT JOIN business_branding b ON b.business_id = lt.business_id
       WHERE lt.id = $1 AND lt.business_id = $2`,
      [id, businessId],
    );
    if (!res.rows || res.rows.length === 0)
      throw new NotFoundException('Linktree page not found');
    return this.mapLinktreeRow(this.databaseService, res.rows[0]);
  }

  async isSlugAvailable(businessId: string, slug: string, excludeId?: string) {
    const result = await this.databaseService.query<{ '?column?': number }>(
      'SELECT 1 FROM linktrees WHERE business_id = $1 AND seo_name = $2 AND ($3::uuid IS NULL OR id <> $3)',
      [businessId, slug, excludeId || null],
    );
    return result.rows.length === 0;
  }

  async isRootSlugAvailable(slug: string, excludeId?: string) {
    const result = await this.databaseService.query(
      `SELECT 1 FROM root_public_slugs
        WHERE page_type='linktree' AND slug=$1
          AND ($2::uuid IS NULL OR linktree_id<>$2)
        LIMIT 1`,
      [slug, excludeId || null],
    );
    return result.rows.length === 0;
  }

  /**
   * Whether the business already has a page under this display name.
   *
   * `linktrees.name` carries no unique constraint and none is wanted: two pages
   * may legitimately share a display name at different slugs. This exists so
   * the editor can warn before the owner ends up with two cards they cannot
   * tell apart in the pages list.
   *
   * Compared case-insensitively and trimmed, because that is how the two would
   * read side by side.
   */
  async isNameAvailable(businessId: string, name: string, excludeId?: string) {
    const trimmed = (name || '').trim();
    if (!trimmed) return true;
    const result = await this.databaseService.query<{ '?column?': number }>(
      `SELECT 1 FROM linktrees
        WHERE business_id = $1
          AND lower(btrim(headline)) = lower(btrim($2))
          AND ($3::uuid IS NULL OR id <> $3)
        LIMIT 1`,
      [businessId, trimmed, excludeId || null],
    );
    return result.rows.length === 0;
  }

  async getLinktreeLinks(linktreeId: string, businessId: string) {
    const ownerCheck = await this.databaseService.query<{ '?column?': number }>(
      'SELECT 1 FROM linktrees WHERE id = $1 AND business_id = $2',
      [linktreeId, businessId],
    );
    if (!ownerCheck.rows || ownerCheck.rows.length === 0)
      throw new NotFoundException('Linktree page not found');

    const res = await this.databaseService.query<LinkRow>(
      `SELECT id, platform, url, display_name, description, default_message, display_order,
              original_input, country_code, gps_lat, gps_lng, custom_color, custom_icon
       FROM links
       WHERE linktree_id = $1
       ORDER BY display_order ASC`,
      [linktreeId],
    );
    return (res.rows || []).map((row) => this.mapLinkRow(row));
  }

  async createLinktree(
    input: CreateLinktreeDto,
    businessId: string,
    scope: LinktreeWriteScope = 'business',
  ) {
    const data = normalizeLinktreeCreate(input);
    const isPlatform = scope === 'platform';
    const linktreeLimit = isPlatform
      ? -1
      : await this.entitlementService.getInteger(
          businessId,
          'limit.linktrees',
          0,
        );
    let uid = '';
    let attempts = 0;
    while (attempts < 10) {
      uid = this.generateUid();
      const checkRes = await this.databaseService.query<{
        '?column?': number;
      }>('SELECT 1 FROM linktrees WHERE business_id = $1 AND uid = $2', [
        businessId,
        uid,
      ]);
      if (checkRes.rows.length === 0) break;
      attempts++;
    }
    if (attempts >= 10)
      throw new ConflictException('Failed to generate unique UID');

    // Explicit routes are optional; otherwise the server generates a unique URL.
    let seoName = data.seo_name || data.slug || '';
    if (seoName) {
      const slugCheck = await this.databaseService.query(
        'SELECT 1 FROM linktrees WHERE business_id = $1 AND seo_name = $2',
        [businessId, seoName],
      );
      if (slugCheck.rows.length > 0)
        throw new ConflictException('SEO URL slug already in use');
    }

    const businessRes = await this.databaseService.query<BusinessDefaultsRow>(
      `SELECT d.background_color AS default_background_color, d.background_pattern AS default_background_pattern, d.template_key AS default_template,
              d.footer_text AS default_footer_text, d.footer_phone AS default_footer_phone,
              d.footer_hidden AS default_footer_hidden, d.whatsapp_enabled AS default_whatsapp_enabled,
              b.default_avatar
       FROM businesses a
       LEFT JOIN business_defaults d ON d.business_id = a.id
       LEFT JOIN business_branding b ON b.business_id = a.id
       WHERE a.id = $1`,
      [businessId],
    );
    const business = businessRes.rows[0] || {};

    const config = this.normalizeTemplateConfig(
      {
        ...data.template_config,
        background_pattern:
          data.template_config?.background_pattern ??
          resolveNewPagePattern(business.default_background_pattern),
      },
      business.default_template,
      true,
    );
    if (!isPlatform)
      await assertLinktreeSeoPlan(this.databaseService, businessId, config);
    await assertLinktreeMediaOwnership(
      this.storage,
      businessId,
      config,
      data.image,
      isPlatform,
    );
    if (!isPlatform) {
      await this.ensureTemplateAllowed(businessId, config.templateKey);
    }
    const whatsappModal = config.whatsapp_modal || {};
    const whatsappQuestions: WhatsappQuestionInput[] = Array.isArray(
      whatsappModal.questions,
    )
      ? (whatsappModal.questions as WhatsappQuestionInput[])
      : [];
    const whatsappEnabled =
      whatsappModal.enabled !== undefined
        ? !!whatsappModal.enabled
        : (business.default_whatsapp_enabled ?? false);
    config.whatsapp_modal = { ...whatsappModal, enabled: whatsappEnabled };

    const image = data.image || business.default_avatar || null;
    const linksToCreate = this.buildCreateLinks(data);

    const row = await this.databaseService.transaction(async (client) => {
      // Serialize capacity checks per business so parallel requests cannot
      // exceed the subscription limit.
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
        [businessId],
      );

      if (!isPlatform && data.is_default) {
        const existingDefault = await client.query<{
          id: string;
          seo_name?: string;
        }>(
          `SELECT id, seo_name FROM linktrees WHERE business_id = $1 AND is_default = true LIMIT 1`,
          [businessId],
        );
        if (existingDefault.rows.length > 0) {
          throw new ConflictException(
            'A default page already exists. Edit the existing page instead.',
          );
        }
      }

      const currentCount = await client.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM linktrees
         WHERE business_id = $1::uuid AND status <> 'deleted'`,
        [businessId],
      );
      if (
        linktreeLimit !== -1 &&
        Number(currentCount.rows[0]?.count || 0) >= linktreeLimit
      ) {
        throw new ForbiddenException(
          data.is_default
            ? 'The default page could not be created because the linktree limit has been reached. Please delete some pages first.'
            : 'The subscription linktree limit has been reached',
        );
      }

      if (!seoName)
        seoName = await this.automaticPageSlug(
          client,
          businessId,
          data.name,
          isPlatform,
        );
      const isDefaultFlag = !isPlatform && data.is_default ? true : false;
      const ltRes = await client.query<LinktreeRow>(
        `INSERT INTO linktrees (
          headline, slogan, slogan_color, description, seo_name, uid, logo, background_color,
          template_key, template_config, whatsapp_modal_enabled,
          footer_text, footer_phone, footer_hidden, status, business_id, is_default
        ) VALUES ($1, $2, $16, $15, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, 'active', $13, $14)
        RETURNING id, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, description, seo_name, uid, logo AS image, background_color,
                  template_key, template_config, whatsapp_modal_enabled,
                  footer_text, footer_phone, footer_hidden, status, is_pinned, is_archived, archived_at, is_default, created_at, updated_at`,
        [
          data.name,
          data.subtitle || null,
          seoName,
          uid,
          image,
          data.background_color ||
            business.default_background_color ||
            DEFAULT_LINKTREE_BACKGROUND_COLOR,
          config.templateKey,
          JSON.stringify(config),
          whatsappEnabled,
          data.footer_text !== undefined
            ? data.footer_text
            : business.default_footer_text || '',
          data.footer_phone !== undefined
            ? data.footer_phone
            : business.default_footer_phone || '',
          data.footer_hidden !== undefined
            ? data.footer_hidden
            : (business.default_footer_hidden ?? false),
          businessId,
          isDefaultFlag,
          data.description || null,
          data.subtitle_color || null,
        ],
      );

      const createdLinktree = ltRes.rows[0];
      await syncWhatsAppQuestions(
        client,
        createdLinktree.id,
        whatsappQuestions,
      );
      for (let i = 0; i < linksToCreate.length; i++) {
        const link = linksToCreate[i];
        await client.query(
          `INSERT INTO links (
            linktree_id, business_id, platform, url, display_name, description, default_message,
            display_order, original_input, country_code, gps_lat, gps_lng, custom_color, custom_icon
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            createdLinktree.id,
            businessId,
            link.platform,
            link.url,
            link.display_name,
            link.description,
            link.default_message,
            i,
            link.original_input,
            link.country_code,
            link.gps_lat,
            link.gps_lng,
            link.custom_color,
            link.custom_icon,
          ],
        );
      }
      return createdLinktree;
    });

    await this.storage.claimBusinessAssets(businessId, image, config);

    return this.mapLinktreeRow(this.databaseService, row);
  }

  private async automaticPageSlug(
    client: Queryable,
    businessId: string,
    headline: string,
    root: boolean,
  ) {
    const base =
      slugifyLinktreeName(headline) ||
      `page-${crypto.createHash('sha256').update(headline.normalize('NFKC').toLowerCase()).digest('hex').slice(0, 12)}`;
    const existing = await client.query<{ seo_name: string }>(
      `SELECT seo_name FROM linktrees WHERE business_id=$1 AND seo_name LIKE $2 || '%'`,
      [businessId, base],
    );
    const used = new Set(existing.rows.map((row) => row.seo_name));
    if (root) {
      const reserved = await client.query<{ slug: string }>(
        `SELECT slug FROM root_public_slugs WHERE page_type='linktree' AND slug LIKE $1 || '%'`,
        [base],
      );
      for (const row of reserved.rows) used.add(row.slug);
    }
    for (let suffix = 1; suffix <= 1000; suffix++) {
      const candidate = suffix === 1 ? base : `${base}-${suffix}`;
      if (!used.has(candidate)) return candidate;
    }
    throw new ConflictException('Unable to generate a unique page URL');
  }

  /**
   * Generates a collision-free duplicate slug based on an existing slug.
   * Handles base slugs, existing '-copy' suffixes, and numbered '-copy-N' or '-N' suffixes cleanly:
   *   - "my-page"        -> "my-page-copy"
   *   - "my-page-copy"   -> "my-page-copy-2"
   *   - "my-page-copy-2" -> "my-page-copy-3"
   *   - "my-page-2"      -> "my-page-3"
   * Loops while checking availability against both business scope and root public slugs.
   */
  async generateDuplicateSlug(
    businessId: string,
    baseSlug: string,
  ): Promise<string> {
    const trimmed = (baseSlug || 'page').toLowerCase().trim();

    const copyNumberedMatch = /^(.*?)-copy-(\d+)$/.exec(trimmed);
    const copyMatch = /^(.*?)-copy$/.exec(trimmed);
    const numberedMatch = /^(.*?)-(\d+)$/.exec(trimmed);

    let prefix: string;
    let nextNum: number;
    let format: (p: string, n: number) => string;

    if (copyNumberedMatch) {
      prefix = copyNumberedMatch[1];
      nextNum = parseInt(copyNumberedMatch[2], 10) + 1;
      format = (p, n) => `${p}-copy-${n}`;
    } else if (copyMatch) {
      prefix = copyMatch[1];
      nextNum = 2;
      format = (p, n) => `${p}-copy-${n}`;
    } else if (numberedMatch) {
      prefix = numberedMatch[1];
      nextNum = parseInt(numberedMatch[2], 10) + 1;
      format = (p, n) => `${p}-${n}`;
    } else {
      prefix = trimmed;
      nextNum = 1;
      format = (p, n) => (n === 1 ? `${p}-copy` : `${p}-copy-${n}`);
    }

    const candidateFor = (number: number) => {
      const suffix = format(prefix, number).slice(prefix.length);
      return format(
        prefix.slice(0, 50 - suffix.length).replace(/-+$/, ''),
        number,
      );
    };
    let candidate = candidateFor(nextNum);
    let attempts = 0;
    while (attempts < 100) {
      const isBusinessAvailable = await this.isSlugAvailable(
        businessId,
        candidate,
      );
      const isRootAvailable = await this.isRootSlugAvailable(candidate);
      if (isBusinessAvailable && isRootAvailable) {
        return candidate;
      }
      nextNum++;
      candidate = candidateFor(nextNum);
      attempts++;
    }
    return `${prefix.slice(0, 40).replace(/-+$/, '')}-copy-${crypto.randomBytes(2).toString('hex')}`;
  }

  async getDuplicateOptions(
    sourceId: string,
    businessId: string,
    slug?: string,
  ) {
    if (slug !== undefined && typeof slug !== 'string')
      throw new BadRequestException('Invalid slug');
    const source = await this.databaseService.query<{ seo_name: string }>(
      "SELECT seo_name FROM linktrees WHERE id=$1 AND business_id=$2 AND status <> 'deleted'",
      [sourceId, businessId],
    );
    if (!source.rows[0]) throw new NotFoundException('Source page not found');
    if (slug !== undefined) {
      const candidate = slug.trim();
      if (!/^[a-z0-9-]{2,50}$/.test(candidate))
        return { slug: candidate, available: false };
      const [local, root] = await Promise.all([
        this.isSlugAvailable(businessId, candidate),
        this.isRootSlugAvailable(candidate),
      ]);
      return { slug: candidate, available: local && root };
    }
    return {
      slug: await this.generateDuplicateSlug(
        businessId,
        source.rows[0].seo_name,
      ),
      available: true,
    };
  }

  /**
   * Generates a clean duplicate name, e.g. "My Store (کۆپی)" or "My Store (کۆپی 2)".
   */
  async generateDuplicateName(
    businessId: string,
    baseName: string,
  ): Promise<string> {
    const trimmed = (baseName || '').trim();
    if (!trimmed) return 'پەڕەی نوێ (کۆپی)';

    const copyMatch = /^(.*?)\s*\((?:کۆپی|Copy)(?:\s+(\d+))?\)$/i.exec(trimmed);
    let prefix = trimmed;
    let num = 1;
    if (copyMatch) {
      prefix = copyMatch[1].trim();
      num = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
    }

    let candidate = num === 1 ? `${prefix} (کۆپی)` : `${prefix} (کۆپی ${num})`;
    let attempts = 0;
    while (attempts < 50) {
      const available = await this.isNameAvailable(businessId, candidate);
      if (available) return candidate;
      num++;
      candidate = `${prefix} (کۆپی ${num})`;
      attempts++;
    }
    return candidate;
  }

  async duplicateLinktree(
    sourceId: string,
    businessId: string,
    dto?: DuplicateLinktreeDto,
    scope: LinktreeWriteScope = 'business',
  ) {
    const isPlatform = scope === 'platform';
    const linktreeLimit = isPlatform
      ? -1
      : await this.entitlementService.getInteger(
          businessId,
          'limit.linktrees',
          0,
        );

    if (linktreeLimit !== -1) {
      const countRes = await this.databaseService.query<{ count: string }>(
        "SELECT COUNT(*) FROM linktrees WHERE business_id = $1 AND status <> 'deleted'",
        [businessId],
      );
      const currentCount = parseInt(countRes.rows[0]?.count || '0', 10);
      if (currentCount >= linktreeLimit) {
        throw new ForbiddenException(
          'گەیشتوویت بە ئەوپەڕی ژمارەی ڕێگەپێدراوی پەڕەکان بۆ ئەم پلانە.',
        );
      }
    }

    // 1. Fetch source linktree
    const sourceRes = await this.databaseService.query<LinktreeRow>(
      `SELECT lt.id, lt.headline AS name, lt.slogan AS subtitle, lt.slogan_color AS subtitle_color, lt.description, lt.seo_name, lt.uid, lt.logo AS image, lt.background_color,
              lt.template_key, lt.template_config, lt.whatsapp_modal_enabled,
              lt.footer_text, lt.footer_phone, lt.footer_hidden, lt.status, lt.is_default
       FROM linktrees lt
       WHERE lt.id = $1 AND lt.business_id = $2 AND lt.status <> 'deleted'`,
      [sourceId, businessId],
    );

    if (!sourceRes.rows || sourceRes.rows.length === 0) {
      throw new NotFoundException('پەڕەی سەرچاوە نەدۆزرایەوە');
    }
    const source = sourceRes.rows[0];

    const targetLogo = dto?.logo !== undefined ? dto.logo : source.image;
    if (
      dto?.logo != null &&
      (!isLinktreeBackgroundImage(dto.logo) ||
        !(await this.storage.areBusinessAssetsOwned(businessId, dto.logo)))
    ) {
      throw new BadRequestException(
        'The replacement logo must belong to this workspace',
      );
    }

    // Check nested copy depth limitation (max 3 levels of nested copies)
    const MAX_COPY_DEPTH = 3;
    let sourceTemplateConfig: Record<string, unknown> = {};
    if (typeof source.template_config === 'string') {
      try {
        sourceTemplateConfig = JSON.parse(source.template_config) as Record<
          string,
          unknown
        >;
      } catch {
        sourceTemplateConfig = {};
      }
    } else if (
      source.template_config &&
      typeof source.template_config === 'object'
    ) {
      sourceTemplateConfig = source.template_config;
    }

    const sourceLineage =
      (sourceTemplateConfig._copy_lineage as {
        source_id?: string;
        origin_id?: string;
        depth?: number;
      }) || null;

    const currentDepth =
      typeof sourceLineage?.depth === 'number' ? sourceLineage.depth : 0;

    if (!isPlatform && currentDepth >= MAX_COPY_DEPTH) {
      throw new BadRequestException(
        `ناتوانیت کۆپی لەم پەڕەیە دروست بکەیت چونکە گەیشتووەتە ئەوپەڕی ئاستی لەبەرگرتنەوە (لانی زۆر ${MAX_COPY_DEPTH} ئاست).`,
      );
    }

    // Check direct copies limitation (max 5 direct copies per page)
    const MAX_DIRECT_COPIES = 5;
    const directCopiesRes = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM linktrees 
       WHERE business_id = $1 
         AND status <> 'deleted'
         AND template_config->'_copy_lineage'->>'source_id' = $2`,
      [businessId, sourceId],
    );
    const directCopiesCount = parseInt(
      directCopiesRes.rows[0]?.count || '0',
      10,
    );

    if (!isPlatform && directCopiesCount >= MAX_DIRECT_COPIES) {
      throw new BadRequestException(
        `ئەم پەڕەیە گەیشتووەتە ئەوپەڕی ژمارەی ڕێگەپێدراوی کۆپیکردنی ڕاستەوخۆ (لانی زۆر ${MAX_DIRECT_COPIES} کۆپی).`,
      );
    }

    // 2. Resolve target slug
    let targetSlug: string;
    if (dto?.slug?.trim()) {
      targetSlug = dto.slug.toLowerCase().trim();
      const isAvailable = await this.isSlugAvailable(businessId, targetSlug);
      const isRootAvailable = await this.isRootSlugAvailable(targetSlug);
      if (!isAvailable || !isRootAvailable) {
        throw new ConflictException(
          'ئەم نازناوە (slug) پێشتر بەکارهاتووە، تکایە دانەیەکی تر هەڵبژێرە.',
        );
      }
    } else {
      targetSlug = await this.generateDuplicateSlug(
        businessId,
        source.seo_name,
      );
    }

    // 3. Resolve target name (names do not carry a unique constraint, so same name is allowed)
    const targetName =
      dto?.headline?.trim() || dto?.name?.trim() || source.name;

    // 4. Fetch source links and whatsapp questions
    const [linksRes, whatsappRes] = await Promise.all([
      this.databaseService.query<LinkRow>(
        `SELECT platform, url, display_name, description, default_message, display_order,
                original_input, country_code, gps_lat, gps_lng, custom_color, custom_icon
         FROM links
         WHERE linktree_id = $1
         ORDER BY display_order ASC`,
        [sourceId],
      ),
      this.databaseService.query<{
        question_text: string;
        video_url?: string | null;
        message: string;
        display_order: number;
      }>(
        `SELECT question_text, message, video_url, display_order
         FROM whatsapp_questions
         WHERE linktree_id = $1
         ORDER BY display_order ASC`,
        [sourceId],
      ),
    ]);

    // 5. Generate unique uid
    let uid = '';
    let attempts = 0;
    while (attempts < 10) {
      uid = this.generateUid();
      const checkRes = await this.databaseService.query<{
        '?column?': number;
      }>('SELECT 1 FROM linktrees WHERE business_id = $1 AND uid = $2', [
        businessId,
        uid,
      ]);
      if (checkRes.rows.length === 0) break;
      attempts++;
    }
    if (!uid) {
      throw new BadRequestException(
        'نەتوانرا ناسێنەری تایبەت (UID) دروست بکرێت',
      );
    }

    // 6. Construct target template_config with copy lineage metadata
    const targetDepth = currentDepth + 1;
    const originId = sourceLineage?.origin_id || sourceId;
    const targetTemplateConfig: Record<string, unknown> = {
      ...sourceTemplateConfig,
      ...(dto?.banner !== undefined
        ? { [LINKTREE_BANNER_KEY]: readLinktreeBanner(dto.banner) }
        : {}),
      ...(dto?.background_image !== undefined
        ? { [BACKGROUND_IMAGE_CONFIG_KEY]: dto.background_image }
        : {}),
      ...(dto?.background_pattern !== undefined
        ? { [BACKGROUND_PATTERN_CONFIG_KEY]: dto.background_pattern }
        : {}),
      ...(dto?.template_key !== undefined
        ? { templateKey: dto.template_key }
        : {}),
      ...(dto?.verification_badge !== undefined
        ? { verification_badge: dto.verification_badge }
        : {}),
      _copy_lineage: {
        source_id: sourceId,
        origin_id: originId,
        depth: targetDepth,
        copied_at: new Date().toISOString(),
      },
    };

    // Only explicit appearance overrides are accepted; source content and tracking config are retained.
    if (
      dto?.banner?.images.some((image) => !isLinktreeBackgroundImage(image))
    ) {
      throw new BadRequestException('Invalid banner images');
    }
    if (dto?.banner !== undefined)
      await assertLinktreeBannerOwnership(this.storage, businessId, {
        [LINKTREE_BANNER_KEY]: targetTemplateConfig[LINKTREE_BANNER_KEY],
      });
    if (
      dto?.background_image != null &&
      (!isLinktreeBackgroundImage(dto.background_image) ||
        !(await this.storage.areBusinessAssetsOwned(
          businessId,
          dto.background_image,
        )))
    ) {
      throw new BadRequestException(
        'The background image must belong to this workspace',
      );
    }
    if (sourceTemplateConfig.sponsor !== undefined) {
      const sponsor = inspectLinktreeSponsor(sourceTemplateConfig.sponsor);
      if (Object.keys(sponsor.errors).length)
        throw new BadRequestException('Invalid sponsor settings');
      targetTemplateConfig.sponsor = sponsor.value;
      await assertLinktreeMediaOwnership(
        this.storage,
        businessId,
        { sponsor: sponsor.value },
        undefined,
        isPlatform,
      );
    }
    const targetTemplateKey = dto?.template_key ?? source.template_key;
    if (
      !isPlatform &&
      dto?.template_key !== undefined &&
      dto.template_key !== source.template_key
    )
      await this.ensureTemplateAllowed(businessId, dto.template_key);

    // 7. Execute atomic transaction
    const row = await this.databaseService.transaction(async (client) => {
      // Share the creation lock so concurrent creates and copies cannot exceed quotas.
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
        [businessId],
      );
      if (dto?.slug?.trim()) {
        const existing = await client.query(
          'SELECT 1 FROM linktrees WHERE business_id=$1 AND seo_name=$2',
          [businessId, targetSlug],
        );
        if (existing.rows.length)
          throw new ConflictException('This public URL is already in use');
      }
      if (!isPlatform) {
        const capacity = await client.query<{ total: number; copies: number }>(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE template_config->'_copy_lineage'->>'source_id'=$2)::int AS copies
           FROM linktrees WHERE business_id=$1::uuid AND status <> 'deleted'`,
          [businessId, sourceId],
        );
        if (linktreeLimit !== -1 && capacity.rows[0].total >= linktreeLimit) {
          throw new ForbiddenException(
            'The link page limit for this subscription has been reached',
          );
        }
        if (capacity.rows[0].copies >= MAX_DIRECT_COPIES) {
          throw new BadRequestException(
            'The direct copy limit for this page has been reached',
          );
        }
      }
      const ltRes = await client.query<LinktreeRow>(
        `INSERT INTO linktrees (
          business_id, headline, slogan, slogan_color, description, seo_name, uid, logo,
          background_color, template_key, template_config, whatsapp_modal_enabled,
          footer_text, footer_phone, footer_hidden, status, is_default
        ) VALUES (
          $1, $2, $3, $17, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16
        ) RETURNING *, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, logo AS image`,
        [
          businessId,
          targetName,
          dto?.slogan ?? source.subtitle,
          dto?.description ?? source.description,
          targetSlug,
          uid,
          targetLogo,
          dto?.background_color ?? source.background_color,
          targetTemplateKey,
          JSON.stringify(targetTemplateConfig),
          source.whatsapp_modal_enabled,
          source.footer_text,
          source.footer_phone,
          source.footer_hidden,
          source.status || 'active',
          false, // duplicates are never default
          dto?.slogan_color !== undefined
            ? dto.slogan_color
            : (source.subtitle_color ?? null),
        ],
      );

      const created = ltRes.rows[0];

      // Clone WhatsApp questions
      for (const q of whatsappRes.rows || []) {
        await client.query(
          `INSERT INTO whatsapp_questions (linktree_id, question_text, message, display_order, video_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            created.id,
            q.question_text,
            q.message,
            q.display_order,
            q.video_url ?? null,
          ],
        );
      }

      // Clone links
      for (const link of linksRes.rows || []) {
        await client.query(
          `INSERT INTO links (
            linktree_id, business_id, platform, url, display_name, description, default_message,
            display_order, original_input, country_code, gps_lat, gps_lng, custom_color, custom_icon
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            created.id,
            businessId,
            link.platform,
            link.url,
            link.display_name,
            link.description,
            link.default_message,
            link.display_order,
            link.original_input,
            link.country_code,
            link.gps_lat,
            link.gps_lng,
            link.custom_color,
            link.custom_icon,
          ],
        );
      }

      return created;
    });

    // Claim assets if image or config contains background assets
    if (targetLogo || targetTemplateConfig) {
      await this.storage.claimBusinessAssets(
        businessId,
        targetLogo,
        targetTemplateConfig,
      );
    }

    return this.mapLinktreeRow(this.databaseService, row);
  }

  private async clearLinktreeCache(
    businessId: string,
    uid: string,
    seoName?: string | null,
    previousSeoName?: string | null,
  ) {
    try {
      const businessRes = await this.databaseService.query<{
        subdomain: string | null;
      }>(`SELECT subdomain FROM businesses WHERE id = $1`, [businessId]);
      const subdomain = businessRes.rows[0]?.subdomain?.toLowerCase();
      const keys = publicLinktreeCacheKeys(
        subdomain,
        uid,
        seoName,
        previousSeoName,
      );
      await Promise.all(keys.map((k) => this.redisService.del(k)));
    } catch (error) {
      // A failed cache purge must not fail the mutation, but it leaves stale
      // public pages behind, so it has to be visible in the logs.
      this.logger.warn(
        `Failed to clear public linktree cache: ${describeError(error)}`,
      );
    }
  }

  async updateLinktree(
    id: string,
    input: UpdateLinktreeDto,
    businessId: string,
    scope: LinktreeWriteScope = 'business',
  ) {
    const { row, current, image, config } =
      await this.databaseService.transaction((client) =>
        updateLinktreeInTransaction(
          client,
          id,
          input,
          businessId,
          scope,
          this.storage,
          (owner, key) => this.ensureTemplateAllowed(owner, key),
        ),
      );

    await this.storage.claimBusinessAssets(businessId, image, config);
    await this.storage.deleteUnreferencedFromValues(
      current.image,
      current.template_config,
    );

    await this.clearLinktreeCache(
      businessId,
      row.uid,
      row.seo_name,
      current.seo_name,
    );

    return this.mapLinktreeRow(this.databaseService, row);
  }

  async pin(businessId: string, id: string, isPinned: boolean) {
    const result = await this.databaseService.query<{
      id: string;
      isPinned: boolean;
    }>(
      'UPDATE linktrees SET is_pinned=$3 WHERE business_id=$1 AND id=$2 RETURNING id,is_pinned AS "isPinned"',
      [businessId, id, isPinned],
    );
    if (!result.rows[0]) throw new NotFoundException('Linktree page not found');
    return result.rows[0];
  }

  async toggleArchive(id: string, businessId: string, isArchived: boolean) {
    const existing = await this.databaseService.query<LinktreeRow>(
      `SELECT is_default FROM linktrees WHERE id = $1 AND business_id = $2`,
      [id, businessId],
    );
    if (!existing.rows || existing.rows.length === 0) {
      throw new NotFoundException('Linktree page not found');
    }
    if (existing.rows[0].is_default && isArchived) {
      throw new BadRequestException('پەیجی بنەڕەتی ناتوانرێت ئەرشیف بکرێت');
    }

    const res = await this.databaseService.query<LinktreeRow>(
      `UPDATE linktrees
       SET is_archived = $1::boolean,
           archived_at = CASE WHEN $1::boolean = true THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING id, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, description, seo_name, uid, logo AS image, background_color,
                 template_key, template_config, whatsapp_modal_enabled,
                 footer_text, footer_phone, footer_hidden, status, is_pinned, is_archived, archived_at, is_default, created_at, updated_at`,
      [isArchived, id, businessId],
    );
    const mapped = await this.mapLinktreeRow(this.databaseService, res.rows[0]);
    await this.clearLinktreeCache(businessId, mapped.uid, mapped.seo_name);
    return mapped;
  }

  async toggleStatus(
    id: string,
    businessId: string,
    status: 'active' | 'inactive',
  ) {
    const existing = await this.databaseService.query<LinktreeRow>(
      `SELECT is_default FROM linktrees WHERE id = $1 AND business_id = $2`,
      [id, businessId],
    );
    if (!existing.rows || existing.rows.length === 0) {
      throw new NotFoundException('Linktree page not found');
    }
    if (existing.rows[0].is_default && status === 'inactive') {
      throw new BadRequestException('پەیجی بنەڕەتی ناتوانرێت ناچالاک بکرێت');
    }

    const res = await this.databaseService.query<LinktreeRow>(
      `UPDATE linktrees
       SET status = $1::varchar,
           updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING id, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, description, seo_name, uid, logo AS image, background_color,
                 template_key, template_config, whatsapp_modal_enabled,
                 footer_text, footer_phone, footer_hidden, status, is_pinned, is_archived, archived_at, is_default, created_at, updated_at`,
      [status, id, businessId],
    );
    if (!res.rows || res.rows.length === 0) {
      throw new NotFoundException('Linktree page not found');
    }
    const mapped = await this.mapLinktreeRow(this.databaseService, res.rows[0]);
    await this.clearLinktreeCache(businessId, mapped.uid, mapped.seo_name);
    return mapped;
  }

  async getDefaultLinktree(
    businessId: string,
    reader: Queryable = this.databaseService,
  ) {
    const res = await reader.query<LinktreeRow>(
      `SELECT lt.id, lt.headline AS name, lt.slogan AS subtitle, lt.slogan_color AS subtitle_color, lt.description, lt.seo_name, lt.uid, lt.logo AS image, lt.background_color,
              lt.template_key, lt.template_config, lt.whatsapp_modal_enabled,
              lt.footer_text, lt.footer_phone, lt.footer_hidden, lt.status, lt.is_pinned, lt.is_archived, lt.archived_at, lt.is_default,
              lt.created_at, lt.updated_at, b.default_avatar AS business_default_avatar
       FROM linktrees lt
       LEFT JOIN business_branding b ON b.business_id = lt.business_id
       WHERE lt.business_id = $1 AND lt.is_default = true
       LIMIT 1`,
      [businessId],
    );
    if (!res.rows || res.rows.length === 0) return null;
    return this.mapLinktreeRow(reader, res.rows[0]);
  }

  /**
   * The address the default page lives at: `/linktree/<slug>`.
   *
   * Prefers the business's own subdomain, so the page reads as
   * `store.example.com/linktree/store` rather than the opaque
   * `default-e56c21f9` it used to be. The subdomain is already lowercase and
   * URL-safe by its own CHECK, which is exactly what `chk_lt_seo_name` wants.
   *
   * Falls back to a slug of the business name, then to the page id, because a
   * name written in Kurdish or Arabic slugifies to nothing — every character is
   * stripped by `^[a-z0-9-]+$`.
   *
   * `seo_name` is unique per business, so a suffix is appended if the business
   * already has a page sitting on that slug.
   */
  private async defaultPageSlug(
    businessId: string,
    subdomain: string | null | undefined,
    name: string | null | undefined,
    reader: Queryable = this.databaseService,
  ): Promise<string> {
    const candidate =
      slugifyLinktreeName(subdomain) ||
      slugifyLinktreeName(name) ||
      `default-${businessId.slice(0, 8)}`;

    const taken = await reader.query<{ seo_name: string }>(
      `SELECT seo_name FROM linktrees
        WHERE business_id = $1 AND seo_name LIKE $2 || '%'`,
      [businessId, candidate],
    );
    const used = new Set(taken.rows.map((row) => row.seo_name));
    if (!used.has(candidate)) return candidate;

    for (let suffix = 2; suffix < 100; suffix += 1) {
      const next = `${candidate}-${suffix}`;
      if (!used.has(next)) return next;
    }
    return `default-${businessId.slice(0, 8)}`;
  }

  async createDefaultLinktree(businessId: string) {
    const existing = await this.getDefaultLinktree(businessId);
    if (existing) return existing;

    return this.databaseService.transaction(async (client) => {
      // Share the creation lock with ordinary/default create requests. Repeated
      // requests return the saved page, never seed over it or its contact links.
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [businessId],
      );
      const saved = await this.getDefaultLinktree(businessId, client);
      if (saved) return saved;

      const businessRes = await client.query<{
        name: string;
        phone: string | null;
        subdomain: string | null;
        logo: string | null;
      }>(
        `SELECT a.name, a.phone, a.subdomain, b.logo
       FROM businesses a
       LEFT JOIN business_branding b ON b.business_id = a.id
       WHERE a.id = $1`,
        [businessId],
      );
      const b = businessRes.rows[0];
      if (!b) throw new NotFoundException('Business not found');

      const uid = this.generateUid();
      const seoName = await this.defaultPageSlug(
        businessId,
        b.subdomain,
        b.name,
        client,
      );
      const config = this.normalizeTemplateConfig(
        null,
        DEFAULT_LINKTREE_TEMPLATE_KEY,
      );
      // Same wording the editor puts on a hand-made page; the normalizer's
      // English placeholders are only there for rows that predate it.
      config.whatsapp_modal = {
        ...config.whatsapp_modal,
        enabled: DEFAULT_LINKTREE_WHATSAPP_ENABLED,
        title: DEFAULT_LINKTREE_WHATSAPP_MODAL_TITLE,
        subtitle: DEFAULT_LINKTREE_WHATSAPP_MODAL_SUBTITLE,
      };

      const ltRes = await client.query<LinktreeRow>(
        `INSERT INTO linktrees (
          business_id, headline, slogan, description, seo_name, uid, logo, background_color,
          template_key, template_config, whatsapp_modal_enabled,
          footer_text, footer_phone, footer_hidden, status, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, 'active', true)
        RETURNING id, headline AS name, slogan AS subtitle, description, seo_name, uid, logo AS image, background_color,
                  template_key, template_config, whatsapp_modal_enabled,
                  footer_text, footer_phone, footer_hidden, status, is_default, created_at, updated_at`,
        [
          businessId,
          b.name,
          DEFAULT_LINKTREE_SUBTITLE || null,
          DEFAULT_LINKTREE_DESCRIPTION,
          seoName,
          uid,
          b.logo || null,
          // The page canvas, never the tenant colour. `website_color` themes
          // the dashboard and the public shell; using it here made a brand-new
          // page inherit a brand colour nobody chose as a background.
          DEFAULT_LINKTREE_BACKGROUND_COLOR,
          config.templateKey,
          JSON.stringify(config),
          DEFAULT_LINKTREE_WHATSAPP_ENABLED,
          // The business name used to land here, which is the page title, not
          // the footer credit the editor puts there.
          DEFAULT_LINKTREE_FOOTER_TEXT,
          DEFAULT_LINKTREE_FOOTER_PHONE,
          DEFAULT_LINKTREE_FOOTER_HIDDEN,
        ],
      );
      const created = ltRes.rows[0];

      // The editor seeds the same starter prompts, so the WhatsApp modal opens
      // with something to pick whichever way the page was created.
      for (const [
        order,
        question,
      ] of DEFAULT_LINKTREE_WHATSAPP_QUESTIONS.entries()) {
        await client.query(
          `INSERT INTO whatsapp_questions (linktree_id, question_text, message, display_order)
           VALUES ($1, $2, $3, $4)`,
          [created.id, question.text, question.message, order],
        );
      }
      // Seed contact buttons before committing, so no later seeding request can
      // replace links authored immediately after the page becomes visible.
      for (const [order, link] of defaultContactLinks(b.phone).entries()) {
        await client.query(
          `INSERT INTO links (linktree_id, business_id, platform, url, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [created.id, businessId, link.platform, link.url, order],
        );
      }
      return this.mapLinktreeRow(client, created);
    });
  }

  async deleteLinktree(
    id: string,
    businessId: string,
    _scope: LinktreeWriteScope = 'business',
  ) {
    const current = await this.getLinktreeById(id, businessId);

    if (current.is_default) {
      throw new BadRequestException('The default page cannot be deleted');
    }

    await this.databaseService.transaction(async (client) => {
      await client.query(
        `INSERT INTO public_page_tombstones
           (business_id, page_type, public_identifier, slug, deleted_at)
         VALUES ($1, 'linktree', $2, $3, now())
         ON CONFLICT (business_id, page_type, public_identifier)
         DO UPDATE SET slug=EXCLUDED.slug, deleted_at=EXCLUDED.deleted_at`,
        [businessId, current.uid, current.seo_name],
      );
      await client.query(
        'DELETE FROM linktrees WHERE id = $1 AND business_id = $2',
        [id, businessId],
      );
    });

    await this.storage.deleteUnreferencedFromValues(
      current.image,
      current.template_config,
    );

    await this.clearLinktreeCache(businessId, current.uid, current.seo_name);

    return { success: true };
  }
}
