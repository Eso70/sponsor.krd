ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_preferred_locale_check;

ALTER TABLE public.users
    ADD CONSTRAINT users_preferred_locale_check
    CHECK (preferred_locale IN ('ckb', 'ar', 'en'));
