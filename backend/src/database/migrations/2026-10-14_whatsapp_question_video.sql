-- Optional external video link. Existing questions and their messages remain intact.
ALTER TABLE public.whatsapp_questions ADD COLUMN IF NOT EXISTS video_url text;
