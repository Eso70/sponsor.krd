import {
  LINKTREE_CATEGORIES,
  readLinktreeSeo,
} from '@linktree/types/linktree-seo.cjs';
// Source-only shared types cannot be loaded by Node; contract tests assert parity.
export const NON_DESCRIPTIVE_PAGE_TEXT = [
  'بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە',
  'للتواصل معنا، اضغط على أحد الروابط أدناه',
  'للتواصل، اضغط على أحد الروابط أدناه',
  'To contact us, tap one of the links below',
  'Explain the main benefits or important details',
  'سوودەکان یان وردەکارییە گرنگەکان بنووسە',
  'اشرح المزايا أو التفاصيل المهمة',
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
  const seo = readLinktreeSeo(page.template_config?.seo);
  if (seo?.indexing === 'noindex') return false;
  return Boolean(
    page.name.trim() &&
    (descriptiveText(page.subtitle) ||
      descriptiveText(page.description) ||
      Boolean(seo?.category && seo.category !== 'other')),
  );
}

/** Expressions come only from internal query constants, never request values. */
function indexableContentSql(name: string, descriptions: string[]): string {
  const prompts = NON_DESCRIPTIVE_PAGE_TEXT.map(
    (text) => `'${text.toLowerCase().replace(/'/g, "''")}'`,
  ).join(', ');
  const descriptive = descriptions.map((expression) => {
    const normalized = `lower(trim(regexp_replace(COALESCE(${expression}, ''), '[[:space:][:cntrl:]]+', ' ', 'g')))`;
    return `(length(${normalized}) > 0 AND ${normalized} NOT IN (${prompts}))`;
  });
  return `(length(trim(regexp_replace(COALESCE(${name}, ''), '[[:space:][:cntrl:]]+', ' ', 'g'))) > 0 AND (${descriptive.join(' OR ')}))`;
}

/** SQL counterpart of the default policy; alias is an internal query constant. */
export function indexableLinktreeSql(
  alias = 'lt',
  advancedAllowedSql = 'true',
): string {
  const content = indexableContentSql(`${alias}.headline`, [
    `${alias}.slogan`,
    `${alias}.description`,
  ]);
  const seo = `${alias}.template_config->'seo'`;
  const versioned = `(${seo}->'version' = '1'::jsonb)`;
  const categories = LINKTREE_CATEGORIES.filter(
    (category) => category.id !== 'other',
  )
    .map((category) => `'${category.id}'`)
    .join(', ');
  const categoryContent = `(length(trim(regexp_replace(COALESCE(${alias}.headline, ''), '[[:space:][:cntrl:]]+', ' ', 'g'))) > 0 AND ${versioned} AND ${seo}->>'category' IN (${categories}))`;
  return `(NOT COALESCE((${versioned} AND ${seo}->>'indexing' = 'noindex'), false) AND (${content} OR (${advancedAllowedSql} AND ${categoryContent})))`;
}

/** Uses the same description normalization as Linktree indexing. */
export function indexableFormSql(alias = 'f'): string {
  return indexableContentSql(`${alias}.definition->>'headline'`, [
    `${alias}.definition->>'description'`,
  ]);
}
