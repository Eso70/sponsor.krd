-- Replace Sponsor.krd branding only; customer branding remains tenant-owned.
ALTER TABLE public.platform_admins
  ALTER COLUMN logo SET DEFAULT '/images/brand/rise-logo.png',
  ALTER COLUMN avatar SET DEFAULT '/images/brand/rise-mark.png',
  ALTER COLUMN favicon SET DEFAULT '/images/brand/rise-favicon.png';

UPDATE public.platform_admins
SET logo = '/images/brand/rise-logo.png',
    avatar = '/images/brand/rise-mark.png',
    favicon = '/images/brand/rise-favicon.png';

UPDATE public.business_branding AS branding
SET logo = '/images/brand/rise-logo.png',
    default_avatar = '/images/brand/rise-mark.png',
    favicon = '/images/brand/rise-favicon.png'
FROM public.businesses AS business
WHERE branding.business_id = business.id
  AND business.account_type = 'platform';
