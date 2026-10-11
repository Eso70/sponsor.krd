-- Add Max without rewriting existing customers' plans or permission policies.
DO $$
DECLARE
  ultra_configuration uuid;
  max_profile uuid;
  max_configuration uuid;
BEGIN
  SELECT id INTO max_profile FROM public.billing_plans WHERE code = 'max';
  IF max_profile IS NULL THEN
  SELECT c.id INTO ultra_configuration FROM public.billing_plan_configurations c
    JOIN public.billing_plans p ON p.id = c.plan_id WHERE p.code = 'ultra';
  IF ultra_configuration IS NULL THEN
    RAISE EXCEPTION 'Ultra permission profile is required before adding Max';
  END IF;
  INSERT INTO public.billing_plans(code, name, description, display_order)
    VALUES ('max', 'Max', 'Everything in Ultra with higher usage limits', 40) RETURNING id INTO max_profile;
  INSERT INTO public.billing_plan_configurations(plan_id) VALUES (max_profile)
    RETURNING id INTO max_configuration;
  INSERT INTO public.billing_plan_permissions(plan_configuration_id, permission_id, access_mode, field_modes, resource_scope, conditions)
    SELECT max_configuration, permission_id, access_mode, field_modes, resource_scope, conditions
    FROM public.billing_plan_permissions WHERE plan_configuration_id = ultra_configuration;
  INSERT INTO public.billing_plan_entitlements(plan_configuration_id, entitlement_id, value)
    SELECT max_configuration, e.entitlement_id,
      CASE catalog.entitlement_key
        WHEN 'limit.tiktok_pixels' THEN CASE WHEN e.value = '-1'::jsonb THEN e.value ELSE to_jsonb(GREATEST((e.value #>> '{}')::bigint, 10)) END
        WHEN 'limit.profile_changes_monthly' THEN CASE WHEN e.value = '-1'::jsonb THEN e.value ELSE to_jsonb(GREATEST((e.value #>> '{}')::bigint, 30)) END
        ELSE e.value END
    FROM public.billing_plan_entitlements e
    JOIN public.billing_entitlements catalog ON catalog.id = e.entitlement_id
    WHERE e.plan_configuration_id = ultra_configuration;
  INSERT INTO public.billing_plan_templates(plan_configuration_id, template_key)
    SELECT max_configuration, template_key FROM public.billing_plan_templates
    WHERE plan_configuration_id = ultra_configuration;
  END IF;
  INSERT INTO public.billing_subscription_plans(code, name, description, permission_profile_id,
    currency, monthly_price_minor, yearly_price_minor, display_order)
    VALUES ('max', 'Max', 'Everything in Ultra with higher usage limits', max_profile,
      'USD', 6000, 60000, 40) ON CONFLICT (code) DO NOTHING;
END $$;

-- Preserve configured annual prices. Recommended monthly prices cost 1/10 of annual.
UPDATE public.billing_subscription_plans SET monthly_price_minor = CEIL(yearly_price_minor / 10.0)
WHERE code IN ('basic','pro','ultra') AND monthly_price_minor = 0 AND yearly_price_minor > 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.business_subscriptions'::regclass
    AND conname='business_subscription_period_check') THEN
    ALTER TABLE public.business_subscriptions ADD CONSTRAINT business_subscription_period_check
      CHECK (current_period_end IS NULL OR current_period_end > current_period_start) NOT VALID;
  END IF;
END $$;
-- NOT VALID keeps any historical malformed rows available for administrator repair,
-- while all new assignments and updates must use a valid period.
