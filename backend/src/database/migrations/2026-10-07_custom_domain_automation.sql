CREATE INDEX IF NOT EXISTS business_domains_retry ON public.business_domains(checked_at)
  WHERE status IN ('pending','disconnected');
