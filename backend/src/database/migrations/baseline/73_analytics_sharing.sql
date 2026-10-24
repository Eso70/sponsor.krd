CREATE TABLE public.analytics_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  public_page_id uuid NOT NULL REFERENCES public.public_pages(id) ON DELETE CASCADE,
  code_hash varchar(64) NOT NULL,
  code_reveal_ciphertext bytea,
  include_submissions boolean NOT NULL DEFAULT false,
  locale varchar(3) NOT NULL CHECK (locale IN ('en','ar','ckb')),
  expires_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);
CREATE INDEX analytics_share_links_owner_page_idx
  ON public.analytics_share_links (business_id, public_page_id, created_at DESC);
