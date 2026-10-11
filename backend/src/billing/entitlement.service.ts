import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import {
  subscriptionAccessSql,
  subscriptionWindowOpen,
} from './subscription-access';

export type EntitlementValue = boolean | number | string;
interface CachedEntitlements {
  values: Record<string, EntitlementValue>;
  end?: string | null;
  cancelsAt?: string | null;
}

@Injectable()
export class EntitlementService {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getEffective(
    businessId: string,
  ): Promise<Record<string, EntitlementValue>> {
    const cacheKey = `entitlements:business:${businessId}`;
    const cached = await this.redis.get<CachedEntitlements>(cacheKey);
    if (
      cached?.values &&
      subscriptionWindowOpen(cached.end, null, cached.cancelsAt)
    )
      return cached.values;
    const result = await this.database.query<{
      entitlement_key: string;
      value: EntitlementValue;
      end?: string | null;
      cancelsAt?: string | null;
    }>(
      `SELECT e.entitlement_key, pe.value, s.current_period_end AS "end", s.cancels_at AS "cancelsAt"
       FROM business_subscriptions s
       JOIN billing_plan_configurations configuration
         ON configuration.id = s.plan_configuration_id
       JOIN billing_plan_entitlements pe
         ON pe.plan_configuration_id = configuration.id
       JOIN billing_entitlements e ON e.id = pe.entitlement_id AND e.status = 'active'
       WHERE s.business_id = $1::uuid
         AND ${subscriptionAccessSql('s')}`,
      [businessId],
    );
    const values = Object.fromEntries(
      result.rows.map((row) => [row.entitlement_key, row.value]),
    ) as Record<string, EntitlementValue>;
    await this.redis.set(
      cacheKey,
      {
        values,
        end: result.rows[0]?.end ?? null,
        cancelsAt: result.rows[0]?.cancelsAt ?? null,
      } satisfies CachedEntitlements,
      60,
    );
    return values;
  }

  async getInteger(
    businessId: string,
    key: string,
    fallback = 0,
  ): Promise<number> {
    const value = (await this.getEffective(businessId))[key];
    return typeof value === 'number' && Number.isSafeInteger(value)
      ? value
      : fallback;
  }

  async hasFeature(businessId: string, key: string): Promise<boolean> {
    return (await this.getEffective(businessId))[key] === true;
  }
}
