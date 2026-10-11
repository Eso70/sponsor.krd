-- Retain the original historical identifiers without modifying audit records.
-- SET NULL foreign keys attempt an UPDATE on parent deletion, which the
-- immutable audit trigger correctly rejects. Keep that protection unchanged.
ALTER TABLE public.billing_policy_audit_events
  DROP CONSTRAINT IF EXISTS billing_policy_audit_events_business_id_fkey,
  DROP CONSTRAINT IF EXISTS billing_policy_audit_events_plan_id_fkey,
  DROP CONSTRAINT IF EXISTS billing_policy_audit_events_plan_configuration_id_fkey;
