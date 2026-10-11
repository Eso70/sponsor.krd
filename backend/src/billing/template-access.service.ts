import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import {
  subscriptionAccessSql,
  subscriptionWindowOpen,
} from './subscription-access';

@Injectable()
export class TemplateAccessService {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getEffectiveKeys(businessId: string): Promise<string[]> {
    const cacheKey = `templates:v3:business:${businessId}`;
    const cached = await this.redis.get<{
      keys: string[];
      end?: string | null;
      cancelsAt?: string | null;
    }>(cacheKey);
    if (
      cached?.keys &&
      subscriptionWindowOpen(cached.end, null, cached.cancelsAt)
    )
      return cached.keys;
    const result = await this.database.query<{
      template_key: string;
      end?: string | null;
      cancelsAt?: string | null;
    }>(
      `SELECT template.template_key, subscription.current_period_end AS "end", subscription.cancels_at AS "cancelsAt"
         FROM business_subscriptions subscription
         JOIN billing_plan_configurations configuration
           ON configuration.id = subscription.plan_configuration_id
         JOIN billing_plans plan
           ON plan.id = configuration.plan_id
         JOIN billing_plan_templates template
           ON template.plan_configuration_id =
              subscription.plan_configuration_id
         WHERE subscription.business_id = $1::uuid
           AND ${subscriptionAccessSql('subscription')}
           AND (
             template.template_key <> 'branch-signal'
             OR LOWER(plan.code) IN ('ultra','max')
           )
         ORDER BY template.template_key`,
      [businessId],
    );
    const keys = result.rows.map((row) => row.template_key);
    await this.redis.set(
      cacheKey,
      {
        keys,
        end: result.rows[0]?.end ?? null,
        cancelsAt: result.rows[0]?.cancelsAt ?? null,
      },
      60,
    );
    return keys;
  }

  async assertAllowed(businessId: string, templateKey: string): Promise<void> {
    if (!(await this.getEffectiveKeys(businessId)).includes(templateKey)) {
      throw new ForbiddenException(
        'This template is not included in your access policy',
      );
    }
  }

  async invalidate(businessId: string): Promise<void> {
    await this.redis.del(`templates:v3:business:${businessId}`);
  }
}
