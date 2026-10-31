-- Existing businesses keep their homepage until they opt in through Settings.
ALTER TABLE public.business_defaults
  ADD COLUMN IF NOT EXISTS homepage_linktree boolean NOT NULL DEFAULT false;
