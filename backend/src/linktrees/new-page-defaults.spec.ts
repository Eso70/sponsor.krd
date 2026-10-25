import { LinktreesService } from './linktrees.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
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
        if (sql.includes('SELECT d.background_color'))
          return Promise.resolve({
            rows: [
              {
                default_background_color: '#abcdef',
                default_background_pattern: 'dots',
                default_template: 'spectrum',
              },
            ],
          });
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
        if (sql.includes(' AS allowed FROM businesses'))
          return Promise.resolve({ rows: [{ allowed: true }] });
        if (sql.includes('SELECT subdomain FROM businesses'))
          return Promise.resolve({ rows: [{ subdomain: 'business' }] });
        return Promise.resolve({ rows: [] });
      });
    const redis = { del: jest.fn() };
    const service = new LinktreesService(
      {
        query,
        transaction: (
          work: (client: { query: typeof query }) => Promise<unknown>,
        ) => work({ query }),
      } as never,
      redis as never,
      { getInteger: jest.fn().mockResolvedValue(100) } as never,
      { assertAllowed: jest.fn() } as never,
      {
        claimBusinessAssets: jest.fn(),
        deleteUnreferencedFromValues: jest.fn(),
      } as never,
      { syncLinks: jest.fn() } as never,
      {} as never,
    );
    return { service, query, redis };
  }

  it.each(['business', 'platform'] as const)(
    'new pages inherit preferences and retain explicit none through %s',
    async (scope) => {
      for (const selected of [undefined, 'none']) {
        const { service, query } = setup();
        await service.createLinktree(
          {
            headline: 'New page',
            slug: 'new-page',
            template_config: selected
              ? { background_pattern: selected }
              : undefined,
          },
          'business-1',
          scope,
        );
        const insert = query.mock.calls.find(([sql]) =>
          sql.includes('INSERT INTO linktrees'),
        );
        expect(insert?.[1]?.[5]).toBe('#abcdef');
        expect(JSON.parse(insert?.[1]?.[7] as string)).toHaveProperty(
          'background_pattern',
          selected ?? 'dots',
        );
        expect(insert?.[1]?.[12]).toBe('business-1');
      }
    },
  );

  it.each(['business', 'platform'] as const)(
    'persists versioned SEO and purges cached public metadata through %s',
    async (scope) => {
      const { service, query, redis } = setup();
      jest
        .spyOn(service, 'getLinktreeById')
        .mockResolvedValue(
          row as Awaited<ReturnType<LinktreesService['getLinktreeById']>>,
        );
      const seo = {
        version: 1,
        category: 'food',
        businessType: 'restaurant',
        title: 'Authored search title',
        indexing: 'noindex',
        language: 'ar',
      };
      await service.updateLinktree(
        row.id,
        { template_config: { templateKey: 'spectrum', seo } },
        'business-1',
        scope,
      );
      const update = query.mock.calls.find(([sql]) =>
        sql.includes('UPDATE linktrees'),
      );
      expect(update?.[0]).toContain('updated_at = NOW()');
      expect(update?.[1]?.[6]).toEqual(
        expect.stringContaining('"category":"food"'),
      );
      expect(JSON.parse(update?.[1]?.[6] as string) as unknown).toMatchObject({
        seo,
      });
      expect(redis.del).toHaveBeenCalledWith(
        'cache:linktree:uid:business:sub:business',
      );
      expect(redis.del).toHaveBeenCalledWith(
        'cache:platform-linktree:business',
      );
    },
  );

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

  it('returns an existing customized default unchanged on repeated seeding requests', async () => {
    const { service, query } = setup();
    const customized = {
      ...row,
      name: 'Authored page',
      seo_name: 'saved-address',
      template_config: { templateKey: 'spectrum', verification_badge: true },
      background_color: '#112233',
    };
    jest
      .spyOn(service, 'getDefaultLinktree')
      .mockResolvedValue(customized as never);
    expect(await service.createDefaultLinktree('business-1')).toEqual(
      customized,
    );
    expect(await service.createDefaultLinktree('business-1')).toEqual(
      customized,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('rechecks after the shared owner lock and preserves a concurrently created default', async () => {
    const { service, query } = setup();
    const lookup = jest
      .spyOn(service, 'getDefaultLinktree')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(row as never);
    expect(await service.createDefaultLinktree('business-1')).toEqual(row);
    expect(query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      ['business-1'],
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(lookup.mock.invocationCallOrder[1]).toBeGreaterThan(
      query.mock.invocationCallOrder[0],
    );
    expect(lookup.mock.calls[1][1]).toEqual(expect.objectContaining({ query }));
  });

  it('rejects create requests targeting an existing default instead of replacing its content or links', async () => {
    const { service, query } = setup();
    const original = query.getMockImplementation()!;
    query.mockImplementation((sql, values) =>
      sql.includes('SELECT id, seo_name FROM linktrees')
        ? Promise.resolve({ rows: [{ id: row.id, seo_name: row.seo_name }] })
        : original(sql, values),
    );
    await expect(
      service.createLinktree(
        { headline: 'Unexpected replacement', is_default: true },
        'business-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      query.mock.calls.some(([sql]) =>
        /(?:UPDATE|INSERT INTO|DELETE FROM) (?:linktrees|links|whatsapp_questions)/.test(
          sql,
        ),
      ),
    ).toBe(false);
  });

  it('seeds contact buttons in the same transaction and never performs a later link replacement', async () => {
    const { service, query } = setup();
    const original = query.getMockImplementation()!;
    query.mockImplementation((sql, values) =>
      sql.includes('SELECT a.name, a.phone')
        ? Promise.resolve({
            rows: [
              {
                name: 'Business',
                phone: '+9647501234567',
                subdomain: 'business',
                logo: null,
              },
            ],
          })
        : original(sql, values),
    );
    jest.spyOn(service, 'getDefaultLinktree').mockResolvedValue(null);
    await service.createDefaultLinktree('business-1');
    const inserts = query.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO links'),
    );
    expect(inserts.map(([, values]) => values)).toEqual([
      [row.id, 'business-1', 'whatsapp', 'https://wa.me/9647501234567', 0],
      [row.id, 'business-1', 'phone', 'tel:+9647501234567', 1],
    ]);
    expect(
      query.mock.calls.some(([sql]) => sql.includes('DELETE FROM links')),
    ).toBe(false);
  });

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

  it.each(['business', 'platform'] as const)(
    'refuses badge changes to a page outside the %s owner',
    async (scope) => {
      const { service, query } = setup();
      const lookup = jest
        .spyOn(service, 'getLinktreeById')
        .mockRejectedValue(new NotFoundException());
      await expect(
        service.updateLinktree(
          row.id,
          {
            template_config: { verification_badge: true },
          },
          'different-owner',
          scope,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(lookup).toHaveBeenCalledWith(row.id, 'different-owner');
      expect(query).not.toHaveBeenCalled();
    },
  );

  it.each(['business', 'platform'] as const)(
    'saves the optional verification badge through %s with strict boolean normalization',
    async (scope) => {
      for (const value of [true, false, undefined, 'true', 1]) {
        const { service, query } = setup();
        jest
          .spyOn(service, 'getLinktreeById')
          .mockResolvedValue(
            row as Awaited<ReturnType<LinktreesService['getLinktreeById']>>,
          );
        await service.updateLinktree(
          row.id,
          {
            template_config: {
              templateKey: 'spectrum',
              verification_badge: value,
            },
          },
          'business-1',
          scope,
        );
        const update = query.mock.calls.find(([sql]) =>
          sql.includes('UPDATE linktrees'),
        );
        const config = update?.[1]?.find(
          (item) => typeof item === 'string' && item.includes('"templateKey"'),
        );
        expect(JSON.parse(config as string)).toHaveProperty(
          'verification_badge',
          value === true,
        );
        expect(update?.[1]).toContain('business-1');
      }
    },
  );

  it.each(['business', 'platform'] as const)(
    'removes retired SEO overrides when saving through %s',
    async (scope) => {
      const { service, query } = setup();
      jest
        .spyOn(service, 'getLinktreeById')
        .mockResolvedValue(
          row as Awaited<ReturnType<LinktreesService['getLinktreeById']>>,
        );
      await service.updateLinktree(
        row.id,
        {
          template_config: {
            templateKey: 'spectrum',
            seo: { title: 'Stale title', robotsIndex: false },
          },
        },
        'business-1',
        scope,
      );
      const update = query.mock.calls.find(([sql]) =>
        sql.includes('UPDATE linktrees'),
      );
      const config = update?.[1]?.find(
        (value) => typeof value === 'string' && value.includes('"templateKey"'),
      );
      expect(typeof config).toBe('string');
      expect(JSON.parse(config as string)).not.toHaveProperty('seo');
      expect(JSON.parse(config as string)).toHaveProperty(
        'templateKey',
        'spectrum',
      );
    },
  );
});
