-- Retire the Linktree campaign flag without removing pages or analytics.
DROP INDEX IF EXISTS public.idx_linktrees_business_campaign_active;
DROP INDEX IF EXISTS public.idx_linktrees_business_default_campaign;
DROP INDEX IF EXISTS public.idx_linktrees_business_archived;

ALTER TABLE public.linktrees DROP COLUMN IF EXISTS is_campaign_active;

CREATE INDEX IF NOT EXISTS idx_linktrees_business_default
  ON public.linktrees (business_id, is_default DESC, created_at DESC);

CREATE INDEX idx_linktrees_business_archived
  ON public.linktrees (business_id, is_archived, is_default DESC, created_at DESC);

UPDATE public.billing_plan_permissions AS rule
SET field_modes = rule.field_modes - 'is_campaign_active', updated_at = NOW()
FROM public.auth_permissions AS permission
WHERE rule.permission_id = permission.id
  AND permission.permission_key = 'business:linktrees:update'
  AND rule.field_modes ? 'is_campaign_active';

UPDATE public.auth_permissions
SET field_schema = field_schema - 'is_campaign_active', updated_at = NOW()
WHERE permission_key = 'business:linktrees:update'
  AND field_schema ? 'is_campaign_active';
