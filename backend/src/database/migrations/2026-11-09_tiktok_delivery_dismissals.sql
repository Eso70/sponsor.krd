-- Hide diagnostic notices without deleting delivery history or stopping retries.
ALTER TABLE marketing_delivery_attempts
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;
