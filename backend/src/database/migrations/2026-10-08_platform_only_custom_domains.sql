-- Domain management belongs exclusively to the platform administrator.
-- Retain historical grants/approval records, but retire these selectable permissions.
UPDATE public.auth_permissions
SET status='inactive', updated_at=now()
WHERE permission_key IN ('business:domains:read','business:domains:manage')
  AND status <> 'inactive';
