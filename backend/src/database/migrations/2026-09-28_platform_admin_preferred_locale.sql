ALTER TABLE public.platform_admins
    ADD COLUMN IF NOT EXISTS preferred_locale character varying(3) NOT NULL DEFAULT 'ckb';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'platform_admins_preferred_locale_check'
          AND conrelid = 'public.platform_admins'::regclass
    ) THEN
        ALTER TABLE public.platform_admins
            ADD CONSTRAINT platform_admins_preferred_locale_check
            CHECK (preferred_locale IN ('ckb', 'ar'));
    END IF;
END $$;
