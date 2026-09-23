ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS preferred_locale character varying(3) DEFAULT 'ckb' NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_preferred_locale_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_preferred_locale_check
            CHECK (preferred_locale IN ('ckb', 'ar'));
    END IF;
END $$;
