import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import type {
  AnalyticsShareLink,
  SharedPageAnalytics,
  FormSubmissionsPage,
  FormSubmissionFilters,
  AnalyticsShareBranding,
} from '@linktree/types';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { UnifiedAnalyticsService } from '../analytics/unified-analytics.service';
import { AnalyticsReadService } from '../analytics/analytics-read.service';
import { FormsService } from '../forms/forms.service';
import { SecretCryptoService } from '../auth/secret-crypto.service';
import {
  buildTenantUrl,
  rootDomainHostname,
  rootDomainPort,
} from '../common/root-domain';
import type { CreateAnalyticsShareDto } from './analytics-sharing.dto';

import {
  sharedLinktreeAnalytics,
  sharedFormAnalytics,
} from './analytics-sharing-projection';

type Kind = 'form' | 'linktree';
type ShareRow = {
  id: string;
  business_id: string;
  public_page_id: string;
  code_hash: string;
  locale: SharedPageAnalytics['locale'];
  expires_at: Date | string | null;
  created_at: Date | string;
  disabled_at: Date | string | null;
  page_type: Kind;
  name: string;
  include_submissions: boolean;
  source_form_id: string | null;
  slug: string;
  website_color: string | null;
  subdomain: string;
  account_type: string;
  business_name: string;
  logo: string | null;
  favicon: string | null;
  can_reveal_code: boolean;
};
const rateScript = `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n`;

@Injectable()
export class AnalyticsSharingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly analytics: UnifiedAnalyticsService,
    private readonly reads: AnalyticsReadService,
    private readonly forms: FormsService,
    private readonly secrets: SecretCryptoService,
  ) {}

  private codeHash(id: string, code: string) {
    const secret =
      this.config.get<string>('APP_ENCRYPTION_KEY') ||
      this.config.get<string>('SESSION_SECRET');
    if (!secret) throw new ServiceUnavailableException('Sharing unavailable');
    return createHmac('sha256', secret)
      .update(`analytics-share:${id}:${code}`)
      .digest('hex');
  }

  private link(
    row: Pick<
      ShareRow,
      | 'id'
      | 'created_at'
      | 'expires_at'
      | 'disabled_at'
      | 'locale'
      | 'include_submissions'
      | 'can_reveal_code'
    >,
    origin: string,
  ): AnalyticsShareLink {
    return {
      id: row.id,
      url: new URL(`/analytics-share/${row.id}?lang=${row.locale}`, origin)
        .href,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      disabled: !!row.disabled_at,
      includeSubmissions: row.include_submissions === true,
      canRevealCode: row.can_reveal_code === true,
    };
  }

  private async ownerOrigin(owner: string): Promise<string> {
    const result = await this.db.query<{
      subdomain: string;
      account_type: string;
      primary_hostname: string | null;
    }>(
      `SELECT business.subdomain, business.account_type, (SELECT domain.hostname FROM business_domains domain WHERE domain.business_id=business.id AND domain.is_primary AND domain.status='active' AND domain.valid_until>now()) AS primary_hostname FROM businesses business WHERE business.id=$1 AND business.status='active'`,
      [owner],
    );
    const business = result.rows[0];
    if (!business) throw new NotFoundException('Business unavailable');
    const base = new URL(
      this.config.get<string>('APP_BASE_URL', 'http://localhost:3011'),
    );
    const root = this.config.get<string>('ROOT_DOMAIN', base.host);
    base.hostname = rootDomainHostname(root);
    base.port ||= rootDomainPort(root).slice(1);
    if (business.account_type === 'platform') return base.origin;
    if (business.primary_hostname)
      return `https://${business.primary_hostname}`;
    return new URL(buildTenantUrl(base.origin, business.subdomain, '/')).origin;
  }

  private assertScope(row: ShareRow, subdomain: string) {
    const expected = row.account_type === 'platform' ? '' : row.subdomain;
    if ((expected || '') !== subdomain)
      throw new NotFoundException('Share link unavailable');
  }

  async branding(
    id: string,
    ip: string,
    subdomain: string,
  ): Promise<AnalyticsShareBranding> {
    await this.limit(
      `rl:analytics-share:branding:${createHash('sha256').update(ip).digest('hex')}`,
      120,
      60,
    );
    const row = await this.live(id);
    // Old root-domain URLs may discover only public branding and their canonical destination.
    if (subdomain) this.assertScope(row, subdomain);
    const origin = await this.ownerOrigin(row.business_id);
    return {
      name: row.business_name,
      logo: row.logo,
      favicon: row.favicon,
      accentColor: row.website_color,
      origin,
      businessTenant: row.account_type !== 'platform',
    };
  }

  private expiration(input: CreateAnalyticsShareDto): string | null {
    if (input.expiresAt && input.expiry !== 'custom')
      throw new BadRequestException(
        'Select custom expiration for a specific date',
      );
    if (!input.expiry || input.expiry === 'never') return null;
    if (input.expiry === 'custom') {
      const value = input.expiresAt;
      const time = value ? Date.parse(value) : NaN;
      if (
        !Number.isFinite(time) ||
        time <= Date.now() ||
        !/Z$|[+-]\d{2}:\d{2}$/.test(value || '')
      )
        throw new BadRequestException(
          'Choose a future date and time with timezone',
        );
      return new Date(time).toISOString();
    }
    const hours = { hour: 1, day: 24, week: 168, month: 720 }[input.expiry];
    return new Date(Date.now() + hours * 3600_000).toISOString();
  }

  async updateExpiry(
    owner: string,
    kind: Kind,
    sourceId: string,
    id: string,
    input: CreateAnalyticsShareDto,
  ) {
    const page = await this.page(owner, kind, sourceId);
    const result = await this.db.query<ShareRow>(
      'UPDATE analytics_share_links SET expires_at=$4::timestamptz WHERE id=$1 AND business_id=$2 AND public_page_id=$3 RETURNING id,created_at,expires_at,disabled_at,locale,include_submissions,(code_reveal_ciphertext IS NOT NULL) AS can_reveal_code',
      [id, owner, page, this.expiration(input)],
    );
    if (!result.rows[0]) throw new NotFoundException('Share link not found');
    return this.link(result.rows[0], await this.ownerOrigin(owner));
  }

  private async page(owner: string, kind: Kind, sourceId: string) {
    const result = await this.db.query<{ id: string }>(
      `SELECT page.id FROM public_pages page JOIN businesses business ON business.id=page.business_id
       WHERE page.business_id=$1 AND page.page_type=$2
       AND CASE WHEN $2='form' THEN page.source_form_id=$3::uuid ELSE page.source_linktree_id=$3::uuid END
       AND business.status='active'`,
      [owner, kind, sourceId],
    );
    if (!result.rows[0]) throw new NotFoundException('Page not found');
    return result.rows[0].id;
  }

  async list(owner: string, kind: Kind, sourceId: string) {
    const page = await this.page(owner, kind, sourceId);
    const rows = await this.db.query<ShareRow>(
      'SELECT id,created_at,expires_at,disabled_at,locale,include_submissions,(code_reveal_ciphertext IS NOT NULL) AS can_reveal_code FROM analytics_share_links WHERE business_id=$1 AND public_page_id=$2 ORDER BY created_at DESC LIMIT 20',
      [owner, page],
    );
    const origin = await this.ownerOrigin(owner);
    return rows.rows.map((row) => this.link(row, origin));
  }

  async create(
    owner: string,
    kind: Kind,
    sourceId: string,
    input: CreateAnalyticsShareDto,
  ) {
    if (input.includeSubmissions && kind !== 'form')
      throw new BadRequestException('Responses can only be shared for forms');
    const expiresAt = this.expiration(input);
    const page = await this.page(owner, kind, sourceId);
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const result = await this.db.transaction(async (client) => {
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [`analytics-share:${page}`],
      );
      const count = await client.query<{ total: string }>(
        'SELECT count(*)::text total FROM analytics_share_links WHERE business_id=$1 AND public_page_id=$2',
        [owner, page],
      );
      if (Number(count.rows[0].total) >= 20)
        throw new BadRequestException(
          'Remove an existing link before creating another',
        );
      const id = (
        await client.query<{ id: string }>('SELECT gen_random_uuid() AS id')
      ).rows[0].id;
      return (
        await client.query<ShareRow>(
          `INSERT INTO analytics_share_links (id,business_id,public_page_id,code_hash,locale,expires_at,include_submissions,code_reveal_ciphertext)
        VALUES ($1,$2,$3,$4,$5,$6::timestamptz,$7,$8) RETURNING id,created_at,expires_at,disabled_at,locale,include_submissions,(code_reveal_ciphertext IS NOT NULL) AS can_reveal_code`,
          [
            id,
            owner,
            page,
            this.codeHash(id, code),
            input.locale,
            expiresAt,
            input.includeSubmissions === true,
            this.secrets.encryptJson({ id, code }),
          ],
        )
      ).rows[0];
    });
    return { ...this.link(result, await this.ownerOrigin(owner)), code };
  }

  async revealCode(owner: string, kind: Kind, sourceId: string, id: string) {
    const page = await this.page(owner, kind, sourceId);
    return this.db.transaction(async (client) => {
      const result = await client.query<{ code_reveal_ciphertext: Buffer }>(
        'SELECT code_reveal_ciphertext FROM analytics_share_links WHERE id=$1 AND business_id=$2 AND public_page_id=$3 AND disabled_at IS NULL AND (expires_at IS NULL OR expires_at>now()) AND code_reveal_ciphertext IS NOT NULL FOR UPDATE',
        [id, owner, page],
      );
      if (!result.rows[0])
        throw new NotFoundException('Code is no longer available');
      const secret = this.secrets.decryptJson(
        result.rows[0].code_reveal_ciphertext,
      );
      if (
        secret.id !== id ||
        typeof secret.code !== 'string' ||
        !/^\d{6}$/.test(secret.code)
      )
        throw new ServiceUnavailableException('Code temporarily unavailable');
      await client.query(
        'UPDATE analytics_share_links SET code_reveal_ciphertext=NULL WHERE id=$1 AND business_id=$2 AND public_page_id=$3',
        [id, owner, page],
      );
      return { code: secret.code };
    });
  }

  async revoke(
    owner: string,
    kind: Kind,
    sourceId: string,
    id: string,
    remove: boolean,
  ) {
    const page = await this.page(owner, kind, sourceId);
    const result = await this.db.query<{ id: string }>(
      remove
        ? 'DELETE FROM analytics_share_links WHERE id=$1 AND business_id=$2 AND public_page_id=$3 RETURNING id'
        : 'UPDATE analytics_share_links SET disabled_at=coalesce(disabled_at,now()),code_reveal_ciphertext=NULL WHERE id=$1 AND business_id=$2 AND public_page_id=$3 RETURNING id',
      [id, owner, page],
    );
    if (!result.rows[0]) throw new NotFoundException('Share link not found');
    return { id };
  }

  private async live(id: string) {
    const result = await this.db.query<ShareRow>(
      `SELECT share.*, page.page_type, page.name, page.slug, page.source_form_id, branding.website_color, branding.logo, branding.favicon, business.subdomain, business.account_type, business.name AS business_name FROM analytics_share_links share
      JOIN public_pages page ON page.id=share.public_page_id AND page.business_id=share.business_id
      JOIN businesses business ON business.id=share.business_id
      LEFT JOIN business_branding branding ON branding.business_id=share.business_id
      WHERE share.id=$1 AND share.disabled_at IS NULL AND (share.expires_at IS NULL OR share.expires_at>now()) AND business.status='active'
      AND ((page.page_type='form' AND EXISTS(SELECT 1 FROM forms WHERE id=page.source_form_id AND business_id=share.business_id))
        OR (page.page_type='linktree' AND EXISTS(SELECT 1 FROM linktrees WHERE id=page.source_linktree_id AND business_id=share.business_id)))`,
      [id],
    );
    if (!result.rows[0])
      throw new UnauthorizedException('Link or access code unavailable');
    return result.rows[0];
  }

  private async limit(key: string, max: number, seconds: number) {
    if (!this.redis.isAvailable())
      throw new ServiceUnavailableException('Sharing temporarily unavailable');
    try {
      const count = Number(
        await this.redis.getClient().eval(rateScript, 1, key, seconds),
      );
      if (count > max)
        throw new UnauthorizedException('Too many attempts. Try again later');
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('Sharing temporarily unavailable');
    }
  }

  async unlock(id: string, code: string, ip: string, subdomain = '') {
    const address = createHash('sha256').update(ip).digest('hex');
    await this.limit(`rl:analytics-share:ip:${address}`, 20, 900);
    await this.limit(`rl:analytics-share:${id}:${address}`, 5, 900);
    await this.limit(`rl:analytics-share:link:${id}`, 50, 86400);
    const row = await this.live(id);
    this.assertScope(row, subdomain);
    const actual = Buffer.from(this.codeHash(id, code), 'hex');
    const expected = Buffer.from(row.code_hash, 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new UnauthorizedException('Link or access code unavailable');
    const token = randomBytes(32).toString('hex');
    const ttl = row.expires_at
      ? Math.min(
          900,
          Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000),
        )
      : 900;
    if (
      ttl < 1 ||
      !(await this.redis.set(
        `analytics-share:session:${id}:${createHash('sha256').update(token).digest('hex')}`,
        true,
        ttl,
      ))
    )
      throw new ServiceUnavailableException('Sharing temporarily unavailable');
    return { token, ttl };
  }

  async report(
    id: string,
    token: string | undefined,
    ip: string,
    responsePage = 0,
    subdomain = '',
    range: { from?: string; to?: string } = {},
  ): Promise<SharedPageAnalytics> {
    if (
      !Number.isSafeInteger(responsePage) ||
      responsePage < 0 ||
      responsePage > 100_000
    )
      throw new BadRequestException('Invalid response page');
    if (range.from && range.to && range.from > range.to)
      throw new BadRequestException('Invalid date range');
    const row = await this.authorized(id, token, ip, subdomain);
    const [summary, actions, formAnalytics, responses] = await Promise.all([
      row.page_type === 'linktree'
        ? this.analytics.getSummary(row.business_id, {
            pageId: row.public_page_id,
            ...range,
          })
        : null,
      row.page_type === 'linktree'
        ? this.reads.getActions(row.business_id, {
            pageId: row.public_page_id,
            ...range,
          })
        : [],
      row.page_type === 'form' && row.source_form_id
        ? this.forms.getAnalytics(row.business_id, row.source_form_id)
        : null,
      row.page_type === 'form' &&
      row.include_submissions === true &&
      row.source_form_id
        ? this.forms.submissions(
            row.business_id,
            row.source_form_id,
            responsePage,
            { pageSize: 20 },
          )
        : null,
    ]);
    this.assertScope(await this.live(id), subdomain);
    const base = {
      accentColor: row.website_color,
      name: row.name,
      locale: row.locale,
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    };
    if (row.page_type === 'linktree' && summary)
      return {
        ...base,
        pageType: 'linktree',
        linktreeAnalytics: sharedLinktreeAnalytics(summary, actions),
      };
    if (row.page_type === 'form' && formAnalytics)
      return {
        ...base,
        pageType: 'form',
        formAnalytics: sharedFormAnalytics(
          formAnalytics,
          row.include_submissions === true,
        ),
        ...(responses && row.source_form_id
          ? {
              responses: this.responseProjection(responses),
              exportDefinition: {
                id: row.source_form_id,
                name: row.name,
                slug: row.slug,
              },
            }
          : {}),
      };
    throw new NotFoundException('Page unavailable');
  }

  async responses(
    id: string,
    token: string | undefined,
    ip: string,
    page: number,
    filters: FormSubmissionFilters,
    subdomain = '',
  ): Promise<FormSubmissionsPage> {
    const row = await this.authorized(id, token, ip, subdomain);
    if (
      row.page_type !== 'form' ||
      row.include_submissions !== true ||
      !row.source_form_id
    )
      throw new UnauthorizedException('Responses are not shared');
    const result = await this.forms.submissions(
      row.business_id,
      row.source_form_id,
      page,
      filters,
      true,
    );
    this.assertScope(await this.live(id), subdomain);
    return this.responseProjection(result);
  }

  private responseProjection(
    responses: FormSubmissionsPage,
  ): FormSubmissionsPage {
    return {
      total: responses.total,
      snapshotAt: responses.snapshotAt,
      items: responses.items.map((response) => ({
        id: response.id,
        createdAt: response.createdAt,
        answers: response.answers,
        consent: response.consent,
        revision: response.revision,
        privacyVersion: response.privacyVersion,
        durationMs: response.durationMs,
        attribution: response.attribution
          ? {
              channel: response.attribution.channel,
              source: response.attribution.source,
              medium: response.attribution.medium,
              campaign: response.attribution.campaign,
              country: response.attribution.country,
              device: response.attribution.device,
              browser: response.attribution.browser,
              os: response.attribution.os,
              referrer: response.attribution.referrer,
              content: response.attribution.content,
              term: response.attribution.term,
            }
          : undefined,
      })),
    };
  }

  private async authorized(
    id: string,
    token: string | undefined,
    ip: string,
    subdomain: string,
  ) {
    await this.limit(
      `rl:analytics-share:read:${createHash('sha256').update(ip).digest('hex')}`,
      120,
      60,
    );
    if (
      !token ||
      !/^[a-f0-9]{64}$/.test(token) ||
      !(await this.redis.get(
        `analytics-share:session:${id}:${createHash('sha256').update(token).digest('hex')}`,
      ))
    )
      throw new UnauthorizedException('Access code required');
    const row = await this.live(id);
    this.assertScope(row, subdomain);
    return row;
  }
}
