export const SPONSOR_KRD_ACCENT_VALUE = 'gradient:to-r:#25F4EE:#FE2C55';

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
