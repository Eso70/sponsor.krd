import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type {
  BusinessDomain,
  BusinessDomains,
  ResolvedBusinessDomain,
} from '@linktree/types';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { publicSubdomainFromHost } from '../common/root-domain';
import { DomainDnsService } from './domain-dns.service';
import { DomainTlsService } from './domain-tls.service';
import { normalizeDomain } from './domain-hostname';

type DomainRow = {
  id: string;
  business_id: string;
  hostname: string;
  status: BusinessDomain['status'];
  is_primary: boolean;
  verification_token: string;
  verified_at: Date | null;
  checked_at: Date | null;
  valid_until: Date | null;
  last_error: BusinessDomain['lastError'];
  created_at: Date;
};

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);
  private rechecking = false;
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly dns: DomainDnsService,
    private readonly redis: RedisService,
    private readonly tls: DomainTlsService,
  ) {}
  get enabled(): boolean {
    return this.config.get<boolean>('CUSTOM_DOMAINS_ENABLED', false);
  }
  private requireEnabled() {
    if (
      !this.enabled ||
      !(
        this.dns.addresses('CUSTOM_DOMAIN_IPV4').length ||
        this.dns.addresses('CUSTOM_DOMAIN_IPV6').length
      )
    )
      throw new ServiceUnavailableException(
        'Custom domains are not enabled or configured',
      );
  }

  async list(businessId: string): Promise<BusinessDomains> {
    const business = await this.db.query<{ subdomain: string }>(
      "SELECT subdomain FROM businesses WHERE id=$1 AND account_type='business'",
      [businessId],
    );
    if (!business.rows[0]) throw new NotFoundException('Business not found');
    const result = await this.db.query<DomainRow>(
      'SELECT * FROM business_domains WHERE business_id=$1 ORDER BY created_at',
      [businessId],
    );
    return {
      enabled: this.enabled,
      target: this.config.get<string>(
        'CUSTOM_DOMAIN_TARGET',
        'domains.sponsor.krd',
      ),
      ipv4: this.dns.addresses('CUSTOM_DOMAIN_IPV4'),
      ipv6: this.dns.addresses('CUSTOM_DOMAIN_IPV6'),
      subdomain: business.rows[0].subdomain,
      domains: result.rows.map((row) => ({
        id: row.id,
        hostname: row.hostname,
        status:
          row.status === 'active' &&
          (!row.valid_until || row.valid_until.getTime() <= Date.now())
            ? 'disconnected'
            : row.status,
        isPrimary:
          row.is_primary &&
          !!row.valid_until &&
          row.valid_until.getTime() > Date.now(),
        verificationToken: row.verification_token,
        verifiedAt: row.verified_at?.toISOString() ?? null,
        checkedAt: row.checked_at?.toISOString() ?? null,
        lastError: row.last_error,
      })),
    };
  }

  private async audit(
    client: { query: (sql: string, params: unknown[]) => Promise<unknown> },
    event: string,
    businessId: string,
    actorId: string | null,
    domain: DomainRow,
  ) {
    await client.query(
      `INSERT INTO billing_policy_audit_events (event_type, actor_id, business_id, resource_type, resource_id, after_value)
      VALUES ($1,$2,$3,'business.domains',$4,jsonb_build_object('hostname',$5::text,'status',$6::text))`,
      [event, actorId, businessId, domain.id, domain.hostname, domain.status],
    );
  }

  async add(
    businessId: string,
    raw: string,
    actorId: string,
  ): Promise<BusinessDomains> {
    this.requireEnabled();
    const hostname = normalizeDomain(
      raw,
      this.config.get<string>('ROOT_DOMAIN', 'localhost'),
    );
    try {
      await this.db.transaction(async (client) => {
        const business = await client.query(
          "SELECT id FROM businesses WHERE id=$1 AND account_type='business' AND status='active' FOR UPDATE",
          [businessId],
        );
        if (!business.rowCount)
          throw new NotFoundException('Active business not found');
        // Expired unverified claims cannot squat on a domain forever.
        await client.query(
          "DELETE FROM business_domains WHERE hostname=$1 AND status='pending' AND created_at < now()-interval '7 days'",
          [hostname],
        );
        const count = await client.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM business_domains WHERE business_id=$1',
          [businessId],
        );
        if (count.rows[0].count >= 1)
          throw new ConflictException({
            code: 'CUSTOM_DOMAIN_LIMIT',
            message:
              'Each business can connect one custom domain. Remove the existing domain before adding another.',
          });
        const result = await client.query<DomainRow>(
          'INSERT INTO business_domains (business_id,hostname,verification_token) VALUES ($1,$2,$3) RETURNING *',
          [businessId, hostname, randomBytes(32).toString('hex')],
        );
        await this.audit(
          client,
          'domain.added',
          businessId,
          actorId,
          result.rows[0],
        );
      });
    } catch (cause) {
      if ((cause as { code?: string }).code === '23505')
        throw new ConflictException(
          'Domain is already connected or awaiting verification',
        );
      throw cause;
    }
    return this.list(businessId);
  }

  async verify(
    businessId: string,
    id: string,
    actorId?: string,
  ): Promise<BusinessDomains> {
    this.requireEnabled();
    if (
      actorId &&
      (await this.redis.isRateLimited(`rl:domain-verify:${businessId}`, 10, 60))
    )
      throw new BadRequestException(
        'Too many verification attempts; try again shortly',
      );
    const result = await this.db.query<DomainRow>(
      'SELECT * FROM business_domains WHERE business_id=$1 AND id=$2',
      [businessId, id],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Domain not found');
    if (
      row.status === 'pending' &&
      Date.now() - row.created_at.getTime() > 7 * 86400000
    )
      throw new BadRequestException(
        'Verification expired; remove and add the domain again',
      );
    const failure = await this.dns.check(row.hostname, row.verification_token);
    await this.db.transaction(async (client) => {
      const current = await client.query<DomainRow>(
        `UPDATE business_domains SET status=$3, last_error=$4::text, checked_at=now(),
        verified_at=CASE WHEN $4::text IS NULL THEN now() ELSE verified_at END,
        valid_until=CASE WHEN $4::text IS NULL THEN now()+interval '48 hours' ELSE NULL END,
        is_primary=CASE WHEN $4::text IS NULL THEN is_primary ELSE false END
        WHERE business_id=$1 AND id=$2 AND verification_token=$5 RETURNING *`,
        [
          businessId,
          id,
          failure
            ? row.status === 'pending'
              ? 'pending'
              : 'disconnected'
            : 'active',
          failure,
          row.verification_token,
        ],
      );
      if (!current.rows[0]) throw new NotFoundException('Domain not found');
      if (actorId || current.rows[0].status !== row.status)
        await this.audit(
          client,
          failure ? 'domain.verification_failed' : 'domain.verified',
          businessId,
          actorId ?? null,
          current.rows[0],
        );
    });
    return this.list(businessId);
  }

  async remove(
    businessId: string,
    id: string,
    actorId: string,
  ): Promise<BusinessDomains> {
    await this.db.transaction(async (client) => {
      const removed = await client.query<DomainRow>(
        'DELETE FROM business_domains WHERE business_id=$1 AND id=$2 RETURNING *',
        [businessId, id],
      );
      if (!removed.rows[0]) throw new NotFoundException('Domain not found');
      await this.audit(
        client,
        'domain.removed',
        businessId,
        actorId,
        removed.rows[0],
      );
    });
    return this.list(businessId);
  }

  async primary(
    businessId: string,
    id: string,
    actorId: string,
  ): Promise<BusinessDomains> {
    this.requireEnabled();
    const candidate = await this.db.query<{ hostname: string }>(
      "SELECT hostname FROM business_domains WHERE id=$1 AND business_id=$2 AND status='active' AND valid_until>now()",
      [id, businessId],
    );
    if (!candidate.rows[0])
      throw new BadRequestException(
        'Verify the domain before making it primary',
      );
    await this.tls.assertReady(candidate.rows[0].hostname);
    await this.db.transaction(async (client) => {
      await client.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE', [
        businessId,
      ]);
      const result = await client.query<DomainRow>(
        "SELECT * FROM business_domains WHERE id=$1 AND business_id=$2 AND status='active' AND valid_until>now() FOR UPDATE",
        [id, businessId],
      );
      if (!result.rows[0])
        throw new BadRequestException(
          'Verify the domain before making it primary',
        );
      await client.query(
        'UPDATE business_domains SET is_primary=false WHERE business_id=$1 AND is_primary',
        [businessId],
      );
      await client.query(
        'UPDATE business_domains SET is_primary=true WHERE id=$1',
        [id],
      );
      await this.audit(
        client,
        'domain.primary_changed',
        businessId,
        actorId,
        result.rows[0],
      );
    });
    return this.list(businessId);
  }

  async resolve(raw: string): Promise<ResolvedBusinessDomain | null> {
    if (!this.enabled) return null;
    const subdomain = publicSubdomainFromHost(
      raw,
      this.config.get<string>('ROOT_DOMAIN', 'localhost'),
    );
    let hostname: string;
    try {
      hostname = normalizeDomain(
        raw,
        this.config.get<string>('ROOT_DOMAIN', 'localhost'),
      );
    } catch {
      if (!subdomain) return null;
      hostname = '';
    }
    const result = await this.db.query<{
      subdomain: string;
      hostname: string;
      primary_hostname: string | null;
    }>(
      `
      SELECT b.subdomain, d.hostname, (SELECT hostname FROM business_domains p WHERE p.business_id=b.id
        AND p.is_primary AND p.status='active' AND p.valid_until>now()) AS primary_hostname
      FROM businesses b LEFT JOIN business_domains d ON d.business_id=b.id AND d.hostname=$1
        AND d.status='active' AND d.valid_until>now()
      WHERE b.status='active' AND b.account_type='business' AND (d.hostname=$1 OR b.subdomain=$2) LIMIT 1`,
      [hostname || null, subdomain || null],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      subdomain: row.subdomain,
      hostname: hostname || raw.toLowerCase().split(':')[0],
      primaryHostname: row.primary_hostname,
      isCustom: !!hostname,
    };
  }

  async recheck(): Promise<void> {
    if (!this.enabled || this.rechecking) return;
    this.rechecking = true;
    try {
      // Atomic claims distribute bounded work across backend processes.
      const result = await this.db.query<DomainRow>(`WITH due AS (
        SELECT d.id FROM business_domains d
        WHERE EXISTS (SELECT 1 FROM businesses b WHERE b.id=d.business_id
          AND b.account_type='business' AND b.status='active') AND (
          (d.status='active' AND (d.checked_at IS NULL OR d.checked_at<now()-interval '6 hours')) OR
          (d.status='pending' AND d.created_at>now()-interval '7 days'
            AND (d.checked_at IS NULL OR d.checked_at<now()-interval '5 minutes')) OR
          (d.status='disconnected' AND (d.checked_at IS NULL OR d.checked_at<now()-interval '15 minutes'))
        ) ORDER BY d.checked_at NULLS FIRST LIMIT 50 FOR UPDATE OF d SKIP LOCKED
      ) UPDATE business_domains d SET checked_at=now() FROM due WHERE d.id=due.id RETURNING d.*`);
      const queue = [...result.rows];
      await Promise.all(
        Array.from({ length: Math.min(5, queue.length) }, async () => {
          for (let row = queue.shift(); row; row = queue.shift()) {
            try {
              await this.verify(row.business_id, row.id);
            } catch (cause) {
              this.logger.warn(
                `Custom-domain recheck failed for ${row.id}: ${cause instanceof Error ? cause.message : 'unknown error'}`,
              );
            }
          }
        }),
      );
    } finally {
      this.rechecking = false;
    }
  }
}
