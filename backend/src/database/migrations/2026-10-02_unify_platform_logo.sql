-- One transparent platform logo also supplies the administrator avatar.
ALTER TABLE public.platform_admins
  ALTER COLUMN logo SET DEFAULT '/images/brand/rise.svg',
  ALTER COLUMN avatar SET DEFAULT '/images/brand/rise.svg';

UPDATE public.platform_admins
SET logo = '/images/brand/rise.svg', avatar = '/images/brand/rise.svg';

UPDATE public.business_branding AS branding
SET logo = '/images/brand/rise.svg', default_avatar = '/images/brand/rise.svg'
FROM public.businesses AS business
WHERE branding.business_id = business.id AND business.account_type = 'platform';
