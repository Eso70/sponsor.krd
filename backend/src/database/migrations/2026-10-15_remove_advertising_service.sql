-- Retire only the Advertising service. Other pages, tenant settings, and audit history remain intact.
CREATE OR REPLACE FUNCTION public.fn_seed_public_marketing_routes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.account_type = 'platform' THEN
    INSERT INTO public.public_pages
      (business_id, page_type, name, slug, status, published_at)
    VALUES
      (NEW.id, 'route', 'Sponsor.krd Home', 'home', 'published', NOW()),
      (NEW.id, 'route', 'Join Sponsor.krd', 'join', 'published', NOW()),
      (NEW.id, 'route', 'Sponsor.krd Application', 'join-application', 'published', NOW())
    ON CONFLICT (business_id, page_type, slug) DO NOTHING;
  ELSIF NEW.account_type = 'business' THEN
    INSERT INTO public.public_pages
      (business_id, page_type, name, slug, status, published_at)
    VALUES
      (NEW.id, 'route', NEW.name || ' Home', 'home', 'published', NOW())
    ON CONFLICT (business_id, page_type, slug) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DELETE FROM public.public_pages WHERE page_type='advertising'
 OR (page_type='route' AND slug='advertising-video-code');
DELETE FROM public.public_page_tombstones WHERE page_type='advertising';
ALTER TABLE public.public_pages DROP CONSTRAINT IF EXISTS public_pages_source_check;
ALTER TABLE public.public_pages DROP CONSTRAINT IF EXISTS public_pages_page_type_check;
ALTER TABLE public.public_pages DROP COLUMN IF EXISTS source_advertising_page_id;
ALTER TABLE public.public_pages ADD CONSTRAINT public_pages_page_type_check CHECK(page_type IN ('linktree','route','form'));
ALTER TABLE public.public_pages ADD CONSTRAINT public_pages_source_check CHECK (
 (page_type='linktree' AND source_linktree_id IS NOT NULL AND source_form_id IS NULL) OR
 (page_type='form' AND source_form_id IS NOT NULL AND source_linktree_id IS NULL) OR
 (page_type='route' AND source_form_id IS NULL AND source_linktree_id IS NULL)
);
ALTER TABLE public.public_page_tombstones DROP CONSTRAINT IF EXISTS public_page_tombstones_page_type_check;
ALTER TABLE public.public_page_tombstones ADD CONSTRAINT public_page_tombstones_page_type_check CHECK(page_type='linktree');

DROP TABLE IF EXISTS public.advertising_package_tiers;
DROP TABLE IF EXISTS public.advertising_package_categories;
DROP TABLE IF EXISTS public.advertising_sections;
DROP TABLE IF EXISTS public.advertising_results;
DROP TABLE IF EXISTS public.advertising_testimonials;
DROP TABLE IF EXISTS public.advertising_faqs;
DROP TABLE IF EXISTS public.advertising_payment_providers;
DROP TABLE IF EXISTS public.advertising_page_versions;
DROP TABLE IF EXISTS public.advertising_pages;
DROP FUNCTION IF EXISTS public.fn_sync_advertising_public_page();

DELETE FROM public.billing_plan_permissions WHERE permission_id IN
 (SELECT id FROM public.auth_permissions WHERE permission_key IN ('business:pages:advertising-access','business:advertising:read','business:advertising:update','business:advertising:publish'));
DELETE FROM public.permission_approval_requests WHERE permission_id IN
 (SELECT id FROM public.auth_permissions WHERE permission_key IN ('business:pages:advertising-access','business:advertising:read','business:advertising:update','business:advertising:publish'));
DELETE FROM public.auth_permissions WHERE permission_key IN ('business:pages:advertising-access','business:advertising:read','business:advertising:update','business:advertising:publish');
DELETE FROM public.billing_plan_entitlements WHERE entitlement_id IN
 (SELECT id FROM public.billing_entitlements WHERE entitlement_key='feature.advertising_page');
DELETE FROM public.billing_entitlements WHERE entitlement_key='feature.advertising_page';
DELETE FROM public.billing_usage_counters WHERE entitlement_key='feature.advertising_page';
