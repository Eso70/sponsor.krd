import { LinktreesService } from './linktrees.service';
import {
  normalizeLinktreeContent,
  normalizeLinktreeCreate,
} from './linktree-content';
import type { CreateLinktreeDto } from './dto/create-linktree.dto';

function setup(taken: string[] = [], rootTaken: string[] = []) {
  const query = jest.fn<
    Promise<{ rows: Record<string, unknown>[] }>,
    [string, unknown[]?]
  >(async (sql: string, params?: unknown[]) => {
    if (sql.includes('SELECT seo_name FROM linktrees'))
      return { rows: taken.map((seo_name) => ({ seo_name })) };
    if (sql.includes('SELECT slug FROM root_public_slugs'))
      return { rows: rootTaken.map((slug) => ({ slug })) };
    if (sql.includes('COUNT(*)')) return { rows: [{ count: 0 }] };
    if (sql.includes('INSERT INTO linktrees'))
      return {
        rows: [
          {
            id: 'page',
            name: params?.[0],
            subtitle: params?.[1],
            seo_name: params?.[2],
            uid: params?.[3],
            image: params?.[4],
            template_config: {},
            template_key: 'spectrum',
          },
        ],
      };
    return { rows: [] };
  });
  const db = {
    query,
    transaction: (
      work: (client: { query: typeof query }) => Promise<unknown>,
    ) => work({ query }),
  };
  const service = new LinktreesService(
    db as never,
    { del: jest.fn() } as never,
    { getInteger: jest.fn(async () => 100) } as never,
    { assertAllowed: jest.fn() } as never,
    {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(true),
      claimBusinessAssets: jest.fn(),
      deleteUnreferencedFromValues: jest.fn(),
    } as never,
    {} as never,
  );
  return { service, query };
}

describe('canonical Linktree content and backend URLs', () => {
  it('preserves old-client content and lets explicit canonical clears win', () => {
    expect(
      normalizeLinktreeContent({
        name: 'Legacy',
        subtitle: 'Tagline',
        image: '/images/upload/old.png',
      }),
    ).toMatchObject({
      name: 'Legacy',
      subtitle: 'Tagline',
      image: '/images/upload/old.png',
    });
    expect(
      normalizeLinktreeContent({
        headline: 'New',
        name: 'Old',
        slogan: '',
        subtitle: 'Old slogan',
        logo: null,
        image: '/images/upload/old.png',
      } as unknown as CreateLinktreeDto),
    ).toMatchObject({ name: 'New', subtitle: '', image: null });
    expect(() => normalizeLinktreeCreate({})).toThrow('Invalid headline');
    expect(() => normalizeLinktreeContent({ headline: ' ' })).toThrow(
      'Invalid headline',
    );
  });
  it.each(['business', 'platform'] as const)(
    'generates collision-free scoped URLs for %s canonical clients',
    async (scope) => {
      const { service, query } = setup(
        ['hello-world', 'hello-world-2'],
        ['hello-world-3'],
      );
      const result = await service.createLinktree(
        {
          headline: 'Hello World',
          slogan: 'Slogan',
          logo: '/images/upload/logo.png',
        },
        'owner',
        scope,
      );
      expect(result).toMatchObject({
        headline: 'Hello World',
        slogan: 'Slogan',
        logo: '/images/upload/logo.png',
        seo_name: scope === 'platform' ? 'hello-world-4' : 'hello-world-3',
      });
      const lock = query.mock.calls.findIndex(([sql]) =>
        sql.includes('pg_advisory_xact_lock'),
      );
      const reservation = query.mock.calls.findIndex(([sql]) =>
        sql.includes('SELECT seo_name FROM linktrees'),
      );
      expect(lock).toBeLessThan(reservation);
      expect(query.mock.calls[reservation][1]).toEqual([
        'owner',
        'hello-world',
      ]);
    },
  );
  it.each(['business', 'platform'] as const)(
    'accepts a manual URL alongside a headline for %s',
    async (scope) => {
      const { service } = setup();
      const result = await service.createLinktree(
        { headline: 'Hello World', seo_name: 'my-custom-address' },
        'owner',
        scope,
      );
      expect(result.seo_name).toBe('my-custom-address');
    },
  );
  it.each([
    'with spaces',
    'UPPERCASE',
    '/other/path',
    '-invalid',
    'x',
    'x'.repeat(256),
  ])('rejects an invalid manual URL %s', (slug) => {
    expect(() =>
      normalizeLinktreeContent({ headline: 'Page', seo_name: slug }),
    ).toThrow('Invalid link slug');
  });
  it('supports Kurdish headlines without a client slug', async () => {
    const { service } = setup();
    const result = await service.createLinktree(
      { headline: 'ئیسماعیل' },
      'owner',
    );
    expect(result.seo_name).toMatch(/^page-[a-f0-9]{12}$/);
    expect(result.headline).toBe('ئیسماعیل');
  });
  it.each([undefined, 'changed-address'])(
    'preserves or explicitly changes an existing URL (%s)',
    async (slug) => {
      const { service, query } = setup();
      jest.spyOn(service, 'getLinktreeById').mockResolvedValue({
        id: 'page',
        name: 'Old',
        seo_name: 'production-url',
        uid: 'stable-id',
        template_key: 'spectrum',
        template_config: {},
        status: 'active',
      } as never);
      query.mockImplementation(async (sql: string, params?: unknown[]) =>
        sql.includes('FROM linktrees WHERE id=$1 AND business_id=$2 FOR UPDATE')
          ? {
              rows: [
                {
                  id: 'page',
                  name: 'Old',
                  seo_name: 'production-url',
                  uid: 'stable-id',
                  template_key: 'spectrum',
                  template_config: {},
                  status: 'active',
                },
              ],
            }
          : sql.includes('UPDATE linktrees')
            ? {
                rows: [
                  {
                    id: 'page',
                    name: params?.[0],
                    seo_name: params?.[2],
                    uid: 'stable-id',
                    template_config: {},
                    template_key: 'spectrum',
                  },
                ],
              }
            : { rows: [] },
      );
      await service.updateLinktree(
        'page',
        {
          headline: 'New heading',
          ...(slug ? { seo_name: slug } : {}),
          slogan: 'New slogan',
        },
        'owner',
      );
      const update = query.mock.calls.find(([sql]) =>
        sql.includes('UPDATE linktrees'),
      )!;
      expect(update[1]?.[2]).toBe(slug ?? 'production-url');
      expect(update[0]).toContain('headline = $1');
    },
  );
});

describe('Linktree advanced SEO plan enforcement', () => {
  it.each([false, true])(
    'checks live Max access before accepting SEO (allowed=%s)',
    async (allowed) => {
      const { service, query } = setup();
      const original = query.getMockImplementation()!;
      query.mockImplementation(async (sql: string, params?: unknown[]) =>
        sql.includes('AS allowed FROM businesses')
          ? { rows: [{ allowed }] }
          : original(sql, params),
      );
      const operation = service.createLinktree(
        {
          headline: 'SEO business',
          template_config: {
            seo: { version: 1, title: 'Custom search title' },
          },
        },
        'business',
      );
      if (allowed) await expect(operation).resolves.toBeDefined();
      else
        await expect(operation).rejects.toThrow(
          'Advanced Linktree SEO requires the Max plan',
        );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("LOWER(feature_plan.code) IN ('max')"),
        ['business'],
      );
    },
  );
});
