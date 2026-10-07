import { ConflictException, Injectable } from '@nestjs/common';
import type { BlockedSubdomains, SubdomainAvailability } from '@linktree/types';
import { DatabaseService } from '../database/database.service';
import {
  BUSINESS_SUBDOMAIN_PATTERN,
  RESERVED_BUSINESS_SUBDOMAINS,
  normalizeBusinessSubdomain,
} from '../common/business-subdomain';

@Injectable()
export class SubdomainPolicyService {
  constructor(private readonly database: DatabaseService) {}

  async list(): Promise<BlockedSubdomains> {
    const result = await this.database.query<{ subdomain: string }>(
      'SELECT subdomain FROM platform_blocked_subdomains ORDER BY subdomain',
    );
    return {
      system: [...RESERVED_BUSINESS_SUBDOMAINS].sort(),
      custom: result.rows
        .map((row) => row.subdomain)
        .filter((name) => !RESERVED_BUSINESS_SUBDOMAINS.has(name)),
    };
  }

  async availability(
    raw: string,
    applicationId?: string,
  ): Promise<SubdomainAvailability> {
    const subdomain = String(raw ?? '')
      .trim()
      .toLowerCase();
    if (!BUSINESS_SUBDOMAIN_PATTERN.test(subdomain))
      return { subdomain, available: false, reason: 'invalid' };
    if (RESERVED_BUSINESS_SUBDOMAINS.has(subdomain))
      return { subdomain, available: false, reason: 'blocked' };
    const result = await this.database.query<{
      blocked: boolean;
      taken: boolean;
    }>(
      `SELECT EXISTS (SELECT 1 FROM platform_blocked_subdomains WHERE subdomain = $1) AS blocked,
         (EXISTS (SELECT 1 FROM businesses WHERE subdomain = $1)
          OR EXISTS (SELECT 1 FROM business_signup_applications
             WHERE requested_subdomain = $1 AND ($2::uuid IS NULL OR id != $2)
               AND status IN ('draft', 'pending', 'changes_requested', 'approved'))) AS taken`,
      [subdomain, applicationId ?? null],
    );
    const row = result.rows[0];
    const reason = row.blocked ? 'blocked' : row.taken ? 'taken' : 'available';
    return { subdomain, available: reason === 'available', reason };
  }

  async add(raw: string, adminId: string): Promise<BlockedSubdomains> {
    const subdomain = normalizeBusinessSubdomain(raw);
    try {
      await this.database.query(
        `WITH blocked AS (
           INSERT INTO platform_blocked_subdomains (subdomain, created_by) VALUES ($1, $2) RETURNING subdomain
         ) INSERT INTO billing_policy_audit_events (event_type, actor_id, resource_type, after_value)
           SELECT 'subdomain.blocked', $2, 'platform.subdomains', jsonb_build_object('subdomain', subdomain) FROM blocked`,
        [subdomain, adminId],
      );
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505')
        throw new ConflictException('Subdomain is already blocked');
      if (code === '23514')
        throw new ConflictException(
          'Subdomain is already in use or reserved by an application',
        );
      throw error;
    }
    return this.list();
  }

  async remove(raw: string, adminId: string): Promise<BlockedSubdomains> {
    const subdomain = normalizeBusinessSubdomain(raw);
    await this.database.query(
      `WITH removed AS (
         DELETE FROM platform_blocked_subdomains WHERE subdomain = $1 RETURNING subdomain
       ) INSERT INTO billing_policy_audit_events (event_type, actor_id, resource_type, before_value)
         SELECT 'subdomain.unblocked', $2, 'platform.subdomains', jsonb_build_object('subdomain', subdomain) FROM removed`,
      [subdomain, adminId],
    );
    return this.list();
  }
}
