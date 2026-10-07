-- Never select or delete a customer's existing domain automatically.
-- Existing installations must resolve any duplicate business assignments first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.business_domains GROUP BY business_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Each business may connect one custom domain. Remove extra domains using the dashboard before applying this migration.';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS business_domains_one_domain ON public.business_domains(business_id);
DROP INDEX IF EXISTS public.business_domains_business;
