import { subscriptionAccessSql } from './subscription-access';

/** Product ceilings apply even when a lower subscription inherits a custom grant. */
export function planAllowsPermission(
  permission: string,
  planCode: string,
): boolean {
  const plan = planCode.trim().toLowerCase();
  if (permission.startsWith('business:forms:')) return plan === 'max';
  if (
    permission.startsWith('business:pages:advertising-') ||
    permission.startsWith('business:advertising:')
  )
    return plan === 'ultra' || plan === 'max';
  return true;
}

/** Internal SQL aliases only; public access always reads the current subscription. */
export function featurePlanSql(
  feature: 'forms' | 'advertising',
  businessAlias: string,
): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(businessAlias))
    throw new Error('Unsafe SQL alias');
  const plans = feature === 'forms' ? "'max'" : "'ultra','max'";
  return `EXISTS (SELECT 1 FROM business_subscriptions feature_subscription
    JOIN billing_subscription_plans feature_plan ON feature_plan.id=feature_subscription.subscription_plan_id
    WHERE feature_subscription.business_id=${businessAlias}.id
      AND ${subscriptionAccessSql('feature_subscription')}
      AND LOWER(feature_plan.code) IN (${plans}))`;
}
