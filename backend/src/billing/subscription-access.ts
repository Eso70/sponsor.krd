/** Shared live access window for dashboard, templates and public entitlements. */
export function subscriptionAccessSql(alias: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias))
    throw new Error('Unsafe subscription alias');
  return `${alias}.status IN ('trialing','active','grace_period')
    AND ${alias}.current_period_start <= NOW()
    AND (${alias}.current_period_end IS NULL OR ${alias}.current_period_end > NOW())
    AND (${alias}.cancels_at IS NULL OR ${alias}.cancels_at > NOW())`;
}

export function subscriptionWindowOpen(
  end?: Date | string | null,
  start?: Date | string | null,
  cancelsAt?: Date | string | null,
  now = Date.now(),
): boolean {
  return (
    (!start || new Date(start).getTime() <= now) &&
    (!end || new Date(end).getTime() > now) &&
    (!cancelsAt || new Date(cancelsAt).getTime() > now)
  );
}
