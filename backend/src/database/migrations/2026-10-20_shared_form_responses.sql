-- Existing links retain their analytics-only scope. No responses are changed.
ALTER TABLE public.analytics_share_links
  ADD COLUMN IF NOT EXISTS include_submissions boolean NOT NULL DEFAULT false;
