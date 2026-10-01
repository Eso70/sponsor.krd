-- A changed administrator username could make seedPlatformAdmin insert a new
-- row with the same configured email. Keep the oldest account identity and all
-- historical rows; only remove sign-in eligibility from later duplicates.
WITH duplicate_emails AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(btrim(email))
           ORDER BY created_at ASC, id ASC
         ) AS position
  FROM public.platform_admins
  WHERE NULLIF(btrim(email), '') IS NOT NULL
)
UPDATE public.platform_admins AS admin
SET email = NULL
FROM duplicate_emails AS duplicate
WHERE admin.id = duplicate.id AND duplicate.position > 1;

UPDATE public.platform_admins
SET email = NULLIF(lower(btrim(email)), '')
WHERE email IS DISTINCT FROM NULLIF(lower(btrim(email)), '');

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_admins_email_ci
  ON public.platform_admins (lower(email))
  WHERE email IS NOT NULL;
