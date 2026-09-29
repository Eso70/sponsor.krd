ALTER TABLE public.platform_admins
    DROP CONSTRAINT IF EXISTS platform_admins_preferred_locale_check;

ALTER TABLE public.platform_admins
    ADD CONSTRAINT platform_admins_preferred_locale_check
    CHECK (preferred_locale IN ('ckb', 'ar', 'en'));
