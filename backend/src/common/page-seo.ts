import type { PageSeo } from '@linktree/types';

// Source-only shared types cannot be loaded by Node; contract tests assert parity.
export const NON_DESCRIPTIVE_PAGE_TEXT = [
  'بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە',
  'للتواصل معنا، اضغط على أحد الروابط أدناه',
  'للتواصل، اضغط على أحد الروابط أدناه',
  'To contact us, tap one of the links below',
] as const;

/** Only bounded, supported metadata reaches storage and public readers. */
export function normalizePageSeo(value: unknown): PageSeo {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const seo: PageSeo = {};
  for (const key of [
    'title',
    'description',
    'ogTitle',
    'ogDescription',
  ] as const) {
    const text = input[key];
    if (typeof text === 'string') {
      const normalized = Array.from(text, (character) => {
        const code = character.codePointAt(0) ?? 0;
        return code < 32 || code === 127 ? ' ' : character;
      })
        .join('')
        .trim();
      if (normalized)
        seo[key] = normalized.slice(0, key.endsWith('escription') ? 320 : 150);
    }
  }
  for (const key of ['robotsIndex', 'robotsFollow'] as const) {
    if (typeof input[key] === 'boolean') seo[key] = input[key];
  }
  if (
    input.locale === 'ckb' ||
    input.locale === 'ar' ||
    input.locale === 'en'
  ) {
    seo.locale = input.locale;
  }
  return seo;
}

/** Campaign pages remain opt-in; permanent profiles need actual descriptive content. */
export function isIndexableLinktree(page: {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  template_config?: Record<string, unknown> | null;
}): boolean {
  const seo = normalizePageSeo(page.template_config?.seo);
  if (seo.robotsIndex !== undefined) return seo.robotsIndex;
  const description = page.description?.trim();
  return Boolean(
    page.name.trim() &&
    (page.subtitle?.trim() ||
      (description &&
        !NON_DESCRIPTIVE_PAGE_TEXT.some((text) => text === description))),
  );
}

/** SQL counterpart of the default policy; alias is an internal query constant. */
export function indexableLinktreeSql(alias = 'lt'): string {
  return `(CASE
    WHEN jsonb_typeof(${alias}.template_config->'seo'->'robotsIndex') = 'boolean'
      THEN (${alias}.template_config->'seo'->>'robotsIndex')::boolean
    ELSE length(trim(${alias}.name)) > 0 AND (
      length(trim(COALESCE(${alias}.subtitle, ''))) > 0 OR (
        length(trim(COALESCE(${alias}.description, ''))) > 0 AND
        trim(${alias}.description) NOT IN (${NON_DESCRIPTIVE_PAGE_TEXT.map((text) => `'${text.replace(/'/g, "''")}'`).join(', ')})
      )
    ) END)`;
}
