export const SPONSOR_KRD_ACCENT_VALUE = 'gradient:to-r:#25F4EE:#FE2C55';
export const SPONSOR_KRD_LOGO = '/images/brand/rise.svg';

export function sponsorKrdFaviconForLogo(logo: string): string {
  return logo === SPONSOR_KRD_LOGO
    ? '/images/brand/rise-favicon-white.png'
    : logo;
}

/** Resolve retired platform assets without changing customer branding. */
export function normalizeSponsorKrdAsset(value: string): string {
  const retired: Record<string, string> = {
    '/images/Logo.jpg': SPONSOR_KRD_LOGO,
    '/images/sponsor-krd-logo-mark.png': SPONSOR_KRD_LOGO,
    '/images/DefaultAvatar.png': SPONSOR_KRD_LOGO,
    '/images/brand/rise-logo.png': SPONSOR_KRD_LOGO,
    '/images/brand/rise-mark.png': SPONSOR_KRD_LOGO,
    '/favicon.ico': '/images/brand/rise-favicon-white.png',
    '/images/brand/rise-favicon.png': '/images/brand/rise-favicon-white.png',
  };
  const pathname = value.split(/[?#]/)[0];
  return Object.hasOwn(retired, pathname) ? retired[pathname] : value;
}

export function normalizeSponsorKrdAccent(value?: string | null): string {
  const resolved = value?.trim();
  // Older installations persisted the first stop as a flat cyan value. Treat
  // that legacy default as the canonical two-stop system gradient so every
  // platform surface receives one continuous, centrally changeable theme.
  if (!resolved || resolved.toLowerCase() === '#25f4ee') {
    return SPONSOR_KRD_ACCENT_VALUE;
  }
  return resolved;
}
