/**
 * A value reduced to what `chk_lt_seo_name` accepts: `^[a-z0-9-]+$`, at least
 * two characters. Returns '' when nothing usable survives, which is what a name
 * written in a non-Latin script leaves behind.
 */
export function slugifyPublicPageName(
  value: string | null | undefined,
): string {
  const slug = (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug.length >= 2 ? slug : '';
}
