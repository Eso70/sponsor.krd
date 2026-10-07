-- Custom blocks supplement the permanent names in common/business-subdomain.ts.
CREATE TABLE public.platform_blocked_subdomains (
  subdomain varchar(63) PRIMARY KEY,
  created_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_subdomain_format CHECK (
    subdomain = lower(subdomain) AND subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
  )
);

-- All assignments and block creation serialize by name. A browser availability
-- result is advisory; these checks remain authoritative during concurrent writes.
CREATE OR REPLACE FUNCTION public.enforce_subdomain_policy() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  candidate text;
BEGIN
  IF TG_TABLE_NAME = 'platform_blocked_subdomains' THEN
    candidate := NEW.subdomain;
  ELSIF TG_TABLE_NAME = 'businesses' THEN
    candidate := NEW.subdomain;
    IF TG_OP = 'UPDATE' AND NEW.subdomain IS NOT DISTINCT FROM OLD.subdomain THEN
      RETURN NEW;
    END IF;
  ELSE
    candidate := NEW.requested_subdomain;
    IF NEW.status NOT IN ('draft', 'pending', 'changes_requested', 'approved') THEN
      RETURN NEW;
    END IF;
  END IF;
  IF candidate IS NULL THEN RETURN NEW; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(candidate, 73007));
  IF TG_TABLE_NAME = 'platform_blocked_subdomains' THEN
    IF EXISTS (SELECT 1 FROM public.businesses WHERE subdomain = candidate)
       OR EXISTS (SELECT 1 FROM public.business_signup_applications
          WHERE requested_subdomain = candidate
            AND status IN ('draft', 'pending', 'changes_requested', 'approved')) THEN
      RAISE EXCEPTION 'Subdomain is already assigned or reserved'
        USING ERRCODE = '23514', CONSTRAINT = 'blocked_subdomain_unassigned';
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.platform_blocked_subdomains WHERE subdomain = candidate) THEN
      RAISE EXCEPTION 'Subdomain is blocked'
        USING ERRCODE = '23514', CONSTRAINT = 'subdomain_not_blocked';
    END IF;
    IF TG_TABLE_NAME = 'business_signup_applications' THEN
      IF EXISTS (SELECT 1 FROM public.businesses
          WHERE subdomain = candidate AND id IS DISTINCT FROM NEW.business_id) THEN
        RAISE EXCEPTION 'Subdomain is already assigned'
          USING ERRCODE = '23514', CONSTRAINT = 'signup_subdomain_available';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_blocked_subdomain ON public.platform_blocked_subdomains;
CREATE TRIGGER enforce_blocked_subdomain BEFORE INSERT OR UPDATE ON public.platform_blocked_subdomains
FOR EACH ROW EXECUTE FUNCTION public.enforce_subdomain_policy();
DROP TRIGGER IF EXISTS enforce_business_subdomain ON public.businesses;
CREATE TRIGGER enforce_business_subdomain BEFORE INSERT OR UPDATE OF subdomain ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.enforce_subdomain_policy();
DROP TRIGGER IF EXISTS enforce_signup_subdomain ON public.business_signup_applications;
CREATE TRIGGER enforce_signup_subdomain BEFORE INSERT OR UPDATE OF requested_subdomain, status ON public.business_signup_applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_subdomain_policy();
