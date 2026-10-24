-- Add dashboard-only pin preferences. Existing pages remain unpinned.
ALTER TABLE public.linktrees ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_linktrees_business_pinned
  ON public.linktrees (business_id, is_pinned DESC, is_default DESC, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_forms_business_pinned
  ON public.forms (business_id, is_archived, is_pinned DESC, updated_at DESC, id);

UPDATE public.auth_permissions
SET field_schema = field_schema || '{"isPinned":"Pin page"}'::jsonb, updated_at=NOW()
WHERE permission_key='business:linktrees:update';
