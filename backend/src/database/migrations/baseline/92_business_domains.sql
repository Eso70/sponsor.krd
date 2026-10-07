CREATE TABLE public.business_domains (
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
CREATE UNIQUE INDEX business_domains_one_primary ON public.business_domains(business_id) WHERE is_primary;
CREATE UNIQUE INDEX business_domains_one_domain ON public.business_domains(business_id);
CREATE INDEX business_domains_recheck ON public.business_domains(checked_at) WHERE status='active';
CREATE INDEX business_domains_retry ON public.business_domains(checked_at) WHERE status IN ('pending','disconnected');
