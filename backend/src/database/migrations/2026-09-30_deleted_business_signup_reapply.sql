ALTER TABLE public.business_signup_applications
    DROP CONSTRAINT IF EXISTS business_signup_applications_status_check;

ALTER TABLE public.business_signup_applications
    ADD CONSTRAINT business_signup_applications_status_check
    CHECK (status IN ('draft', 'pending', 'changes_requested', 'approved', 'rejected', 'deleted'));

-- Hard-deleted businesses leave their application behind through ON DELETE SET NULL.
-- Close those legacy approvals and release their reserved subdomains so a new
-- invitation can reuse the verified owner without reviving the deleted tenant.
WITH closed AS (
    UPDATE public.business_signup_applications
    SET status = 'deleted',
        business_name = NULL,
        phone = NULL,
        requested_subdomain = NULL,
        logo = NULL,
        favicon = NULL,
        default_avatar = NULL,
        selected_subscription_plan_id = NULL
    WHERE status = 'approved' AND business_id IS NULL
    RETURNING id
)
INSERT INTO public.business_signup_application_events
    (application_id, actor_type, event_type)
SELECT id, 'system', 'business_deleted' FROM closed;
