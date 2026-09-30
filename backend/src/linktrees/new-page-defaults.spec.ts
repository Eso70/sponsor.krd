import { LinktreesService } from './linktrees.service';
import {
  DEFAULT_LINKTREE_BACKGROUND_COLOR,
  DEFAULT_LINKTREE_TEMPLATE_KEY,
  DEFAULT_LINKTREE_FOOTER_HIDDEN,
} from '../common/linktree-defaults';

describe('new-page defaults isolation', () => {
  const row = {
    id: 'page-1',
    name: 'Business',
    uid: 'lt-page',
    seo_name: 'business',
    template_key: 'spectrum',
    template_config: {},
    background_color: '#ffffff',
    footer_hidden: true,
    whatsapp_modal_enabled: false,
    status: 'active',
    is_default: true,
    image: null,
  };

  function setup() {
    const query = jest
      .fn<Promise<{ rows: unknown[] }>, [string, unknown[]?]>()
      .mockImplementation((sql: string) => {
        if (
          sql.includes('UPDATE linktrees') ||
          sql.includes('INSERT INTO linktrees')
        ) {
          return Promise.resolve({ rows: [row] });
        }
        if (sql.includes('SELECT a.name, a.phone')) {
          return Promise.resolve({
            rows: [
              {
                name: 'Business',
                phone: null,
                subdomain: 'business',
                logo: null,
                default_template: 'custom-template',
                default_background_color: '#123456',
                default_footer_hidden: false,
                default_whatsapp_enabled: true,
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      });
    const service = new LinktreesService(
      {
        query,
        transaction: (
          work: (client: { query: typeof query }) => Promise<unknown>,
        ) => work({ query }),
      } as never,
      { del: jest.fn() } as never,
      {} as never,
      { assertAllowed: jest.fn() } as never,
      {
        claimBusinessAssets: jest.fn(),
        deleteUnreferencedFromValues: jest.fn(),
      } as never,
      { syncLinks: jest.fn() } as never,
      {} as never,
    );
    return { service, query };
  }

  it.each(['business', 'platform'] as const)(
    'editing a default page through %s does not overwrite new-page defaults',
    async (scope) => {
      const { service, query } = setup();
      jest
        .spyOn(service, 'getLinktreeById')
        .mockResolvedValue(
          row as Awaited<ReturnType<LinktreesService['getLinktreeById']>>,
        );
      await service.updateLinktree(
        row.id,
        { background_color: '#123456' },
        'business-1',
        scope,
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE linktrees'),
        expect.arrayContaining(['#123456', row.id, 'business-1']),
      );
      expect(
        query.mock.calls.some(([sql]) =>
          String(sql).includes('business_defaults'),
        ),
      ).toBe(false);
    },
  );

  it('creates the business default page independently of new-page starting values', async () => {
    const { service, query } = setup();
    jest.spyOn(service, 'getDefaultLinktree').mockResolvedValue(null);
    await service.createDefaultLinktree('business-1');
    const insert = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO linktrees'),
    );
    expect(insert).toBeDefined();
    const values = insert?.[1] as unknown[];
    expect(values[7]).toBe(DEFAULT_LINKTREE_BACKGROUND_COLOR);
    expect(values[8]).toBe(DEFAULT_LINKTREE_TEMPLATE_KEY);
    expect(values[10]).toBe(false);
    expect(values[13]).toBe(DEFAULT_LINKTREE_FOOTER_HIDDEN);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('business_defaults'),
      ),
    ).toBe(false);
  });
});
