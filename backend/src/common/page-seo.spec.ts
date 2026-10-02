import { isIndexableLinktree, normalizePageSeo } from './page-seo';

describe('stored page SEO policy', () => {
  it('bounds metadata and rejects arbitrary fields and false-like strings', () => {
    expect(
      normalizePageSeo({
        title: 'x'.repeat(200),
        robotsIndex: 'false',
        canonicalUrl: 'https://evil.test',
        locale: 'invented',
      }),
    ).toEqual({ title: 'x'.repeat(150) });
    expect(
      normalizePageSeo({ title: ' real\nname ', robotsIndex: false }),
    ).toEqual({ title: 'real name', robotsIndex: false });
  });
  it('defaults thin pages to noindex and respects deliberate index/noindex', () => {
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
    ).toBe(true);
  });
});
