// Source-only shared types cannot be loaded by Node; contract tests assert parity.
export const NON_DESCRIPTIVE_PAGE_TEXT = [
  'بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە',
  'للتواصل معنا، اضغط على أحد الروابط أدناه',
  'للتواصل، اضغط على أحد الروابط أدناه',
  'To contact us, tap one of the links below',
] as const;

function descriptiveText(value?: string | null): boolean {
  const normalized = (value || '')
    .replace(/[\p{Cc}\s]+/gu, ' ')
    .trim()
    .toLowerCase();
  return Boolean(
    normalized &&
    !NON_DESCRIPTIVE_PAGE_TEXT.some(
      (text) => text.toLowerCase() === normalized,
    ),
  );
}

/** Public profiles need real descriptive content; retired SEO overrides are ignored. */
export function isIndexableLinktree(page: {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  template_config?: Record<string, unknown> | null;
}): boolean {
  return Boolean(
    page.name.trim() &&
    (descriptiveText(page.subtitle) || descriptiveText(page.description)),
  );
}

/** SQL counterpart of the default policy; alias is an internal query constant. */
export function indexableLinktreeSql(alias = 'lt'): string {
  const prompts = NON_DESCRIPTIVE_PAGE_TEXT.map(
    (text) => `'${text.toLowerCase().replace(/'/g, "''")}'`,
  ).join(', ');
  const descriptive = (field: 'subtitle' | 'description') => {
    const normalized = `lower(trim(regexp_replace(COALESCE(${alias}.${field}, ''), '[[:space:][:cntrl:]]+', ' ', 'g')))`;
    return `(length(${normalized}) > 0 AND ${normalized} NOT IN (${prompts}))`;
  };
  return `(length(trim(${alias}.name)) > 0 AND (${descriptive('subtitle')} OR ${descriptive('description')}))`;
}
