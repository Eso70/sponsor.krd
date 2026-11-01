-- Additive owner-wide defaults. Existing forms and saved responses are unchanged.
ALTER TABLE public.business_defaults
  ADD COLUMN IF NOT EXISTS form_whatsapp_templates jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(form_whatsapp_templates) = 'object');
