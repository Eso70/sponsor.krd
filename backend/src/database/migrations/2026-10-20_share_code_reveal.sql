-- Older hash-only codes cannot be recovered. New links get one encrypted reveal.
ALTER TABLE public.analytics_share_links
  ADD COLUMN IF NOT EXISTS code_reveal_ciphertext bytea;
