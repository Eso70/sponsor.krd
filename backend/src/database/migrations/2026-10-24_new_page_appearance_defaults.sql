-- Only new-page preferences change; saved pages and saved colors remain intact.
ALTER TABLE public.business_defaults
  ADD COLUMN IF NOT EXISTS background_pattern text NOT NULL DEFAULT 'grid45'
  CHECK (background_pattern IN ('none','grid','grid45','dots','diagonal','cross','circles','waves','zigzag'));
ALTER TABLE public.business_defaults ALTER COLUMN background_color SET DEFAULT '#161b22';
UPDATE public.auth_permissions
SET field_schema = field_schema || '{"default_background_pattern":"Default background pattern"}'::jsonb
WHERE permission_key = 'business:defaults:update';
