CREATE TABLE IF NOT EXISTS public.business_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  hostname varchar(253) NOT NULL UNIQUE,
  verification_token varchar(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','disconnected')),
  is_primary boolean NOT NULL DEFAULT false,
  verified_at timestamptz, checked_at timestamptz, valid_until timestamptz,
  last_error varchar(20) CHECK (last_error IN ('ownership','routing')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domain_hostname_format CHECK (hostname=lower(hostname) AND length(hostname)<=253 AND hostname ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  CONSTRAINT domain_verification_token_format CHECK (verification_token ~ '^[a-f0-9]{64}$'),
  CONSTRAINT domain_primary_active CHECK (NOT is_primary OR (status='active' AND valid_until IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS business_domains_one_primary ON public.business_domains(business_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS business_domains_business ON public.business_domains(business_id);
CREATE INDEX IF NOT EXISTS business_domains_recheck ON public.business_domains(checked_at) WHERE status='active';

INSERT INTO public.auth_permissions (permission_key,resource,action,description,risk_level,category,display_order)
VALUES ('business:domains:read','business.domains','read','View business custom domains and DNS instructions','standard','Business account',41),
       ('business:domains:manage','business.domains','manage','Add, verify, remove and select business custom domains','sensitive','Business account',42)
ON CONFLICT (permission_key) DO NOTHING;
-- Existing plans inherit domain access from their settings access. Explicit denials stay denied.
INSERT INTO public.billing_plan_permissions (plan_configuration_id,permission_id,access_mode)
SELECT grants.plan_configuration_id, domains.id, CASE WHEN grants.access_mode='direct' THEN 'direct' ELSE 'deny' END
FROM public.billing_plan_permissions grants
JOIN public.auth_permissions settings ON settings.id=grants.permission_id AND settings.permission_key='business:pages:settings-access'
CROSS JOIN public.auth_permissions domains
WHERE domains.permission_key IN ('business:domains:read','business:domains:manage')
ON CONFLICT (plan_configuration_id,permission_id) DO NOTHING;

