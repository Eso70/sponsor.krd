-- Optional per-language presentation settings; existing message templates stay intact.
ALTER TABLE public.business_defaults
  ADD COLUMN IF NOT EXISTS form_whatsapp_details jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(form_whatsapp_details) = 'object');
