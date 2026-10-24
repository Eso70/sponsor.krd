import { PublicService } from './public.service';

describe('live Max SEO access on cached public pages', () => {
  it('disables paid settings on downgrade and restores them on upgrade without changing stored data', async () => {
    let allowed = false;
    const cached = {
      linktree: {
        id: 'page',
        name: 'Page headline',
        description: 'Ordinary page description',
        template_config: {
          seo: {
            version: 1,
            title: 'Paid search title',
            category: 'food',
            indexing: 'noindex',
          },
        },
      },
      links: [],
    };
    const query = jest.fn(async (sql: string) => ({
      rows: sql.includes('AS allowed') ? [{ allowed }] : [{ id: 'page' }],
    }));
    const service = new PublicService(
      { query } as never,
      { get: jest.fn(async () => cached) } as never,
      { forSource: jest.fn(async () => ({})) } as never,
      {} as never,
    );
    for (const max of [false, true, false]) {
      allowed = max;
      const result = await service.getPublicLinktreeByUidAndSubdomain(
        'page',
        'tenant',
      );
      expect(result.linktree.template_config.seo).toEqual(
        max
          ? cached.linktree.template_config.seo
          : { version: 1, indexing: 'noindex' },
      );
      expect(result.linktree.name).toBe('Page headline');
    }
    expect(cached.linktree.template_config.seo.title).toBe('Paid search title');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(feature_plan.code) IN ('max')"),
      ['page'],
    );
  });
});
