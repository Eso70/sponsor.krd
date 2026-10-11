-- Update the shared configuration used by creation quotas and catalog cards.
-- All versions of these default profiles receive the requested limits.
INSERT INTO public.billing_plan_entitlements
  (plan_configuration_id, entitlement_id, value)
SELECT configuration.id, entitlement.id,
       to_jsonb(CASE plan.code WHEN 'basic' THEN 20 ELSE 100 END)
FROM public.billing_plan_configurations configuration
JOIN public.billing_plans plan ON plan.id = configuration.plan_id
CROSS JOIN public.billing_entitlements entitlement
WHERE plan.code IN ('basic', 'pro')
  AND entitlement.entitlement_key = 'limit.linktrees'
ON CONFLICT (plan_configuration_id, entitlement_id)
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
WHERE billing_plan_entitlements.value IS DISTINCT FROM EXCLUDED.value;
