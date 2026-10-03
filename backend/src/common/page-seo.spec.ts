import { isIndexableLinktree, indexableLinktreeSql } from './page-seo';

describe('stored page SEO policy', () => {
  it('derives sitemap eligibility from content rather than manual choices', () => {
    const sql = indexableLinktreeSql();
    expect(sql).toContain('lt.name');
    expect(sql).toContain('lt.subtitle');
    expect(sql).toContain('lt.description');
    expect(sql).toContain('regexp_replace');
    expect(sql).not.toContain('robotsIndex');
    expect(sql).not.toContain('template_config');
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
