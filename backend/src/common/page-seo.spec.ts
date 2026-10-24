import { isIndexableLinktree, indexableLinktreeSql } from './page-seo';

describe('stored page SEO policy', () => {
  it('derives sitemap eligibility from content rather than manual choices', () => {
    const sql = indexableLinktreeSql();
    expect(sql).toContain('lt.headline');
    expect(sql).toContain('lt.slogan');
    expect(sql).toContain('lt.description');
    expect(sql).toContain('regexp_replace');
    expect(sql).not.toContain('robotsIndex');
    expect(sql).toContain('template_config');
    expect(sql).toContain("'1'::jsonb");
    expect(sql).toContain("'noindex'");
  });
  it('accepts visible categories but lets versioned noindex veto real content', () => {
    const page = {
      name: 'Business',
      template_config: { seo: { version: 1, category: 'food' } },
    };
    expect(isIndexableLinktree(page)).toBe(true);
    expect(
      isIndexableLinktree({
        ...page,
        template_config: { seo: { version: 1, category: 'invalid' } },
      }),
    ).toBe(false);
    expect(
      isIndexableLinktree({
        ...page,
        template_config: { seo: { version: 1, category: 'other' } },
      }),
    ).toBe(false);
    expect(
      isIndexableLinktree({
        ...page,
        subtitle: 'Real services',
        template_config: { seo: { version: 1, indexing: 'noindex' } },
      }),
    ).toBe(false);
  });
  it('excludes starter pages and ignores retired index/noindex settings', () => {
    const page = {
      name: 'Business',
      description: 'بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە',
    };
    expect(isIndexableLinktree(page)).toBe(false);
    expect(
      isIndexableLinktree({ ...page, subtitle: 'Actual business information' }),
    ).toBe(true);
    expect(
      isIndexableLinktree({
        ...page,
        template_config: { seo: { robotsIndex: true } },
      }),
    ).toBe(false);
    expect(
      isIndexableLinktree({
        ...page,
        subtitle: 'Actual services',
        template_config: { seo: { robotsIndex: false } },
      }),
    ).toBe(true);
    expect(
      isIndexableLinktree({
        ...page,
        description: ' TO CONTACT US,\nTAP ONE OF THE LINKS BELOW ',
      }),
    ).toBe(false);
    expect(
      isIndexableLinktree({ ...page, name: ' ', subtitle: 'Actual services' }),
    ).toBe(false);
  });
});
