/** Field aliases describe the same stored value and must share authorization rules. */
const contentAliases: Record<string, string> = {
  headline: 'name',
  slogan: 'subtitle',
  slogan_color: 'subtitle_color',
  logo: 'image',
};

export function resolveLinktreeFieldMode<T extends string | null>(
  permission: string,
  field: string,
  modes: Record<string, T> | null | undefined,
  fallback: T,
): T {
  if (!permission.endsWith(':linktrees:update'))
    return modes?.[field] || fallback;
  const canonical = Object.keys(contentAliases).find(
    (key) => key === field || contentAliases[key] === field,
  );
  if (!canonical) return modes?.[field] || fallback;
  return modes?.[canonical] || modes?.[contentAliases[canonical]] || fallback;
}
