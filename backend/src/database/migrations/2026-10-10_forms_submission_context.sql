ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS analytics_event_id uuid REFERENCES public.analytics_events(id) ON DELETE SET NULL;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS duration_ms integer CHECK(duration_ms IS NULL OR duration_ms BETWEEN 0 AND 86400000);
CREATE INDEX IF NOT EXISTS form_submissions_analytics_idx ON public.form_submissions(analytics_event_id) WHERE analytics_event_id IS NOT NULL;
