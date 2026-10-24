import { LinktreesService } from './linktrees.service';

describe('LinktreesService duplication algorithms', () => {
  let service: LinktreesService;

  beforeEach(() => {
    // Provide minimal mock dependencies to construct LinktreesService
    service = new LinktreesService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('generateDuplicateSlug', () => {
    it('keeps copy suggestions inside the 50-character slug limit', async () => {
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);
      const slug = await service.generateDuplicateSlug('owner', 'a'.repeat(50));
      expect(slug).toHaveLength(50);
      expect(slug).toMatch(/-copy$/);
    });
    it('generates [slug]-copy for a simple slug if available', async () => {
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);

      const slug = await service.generateDuplicateSlug('biz-1', 'my-page');
      expect(slug).toBe('my-page-copy');
    });

    it('generates [slug]-copy-2 when duplicating a [slug]-copy page', async () => {
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);

      const slug = await service.generateDuplicateSlug('biz-1', 'my-page-copy');
      expect(slug).toBe('my-page-copy-2');
    });

    it('increments numbered copy [slug]-copy-N correctly (e.g. -copy-2 -> -copy-3)', async () => {
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);

      const slug = await service.generateDuplicateSlug('biz-1', 'promo-copy-2');
      expect(slug).toBe('promo-copy-3');
    });

    it('increments numbered slug [slug]-N correctly (e.g. -2 -> -3)', async () => {
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);

      const slug = await service.generateDuplicateSlug('biz-1', 'store-2');
      expect(slug).toBe('store-3');
    });

    it('skips taken candidates until finding an available one', async () => {
      // Simulate my-page-copy and my-page-copy-2 taken, my-page-copy-3 free
      service.isSlugAvailable = jest
        .fn()
        .mockImplementation((_bizId, candidate) => {
          if (candidate === 'my-page-copy' || candidate === 'my-page-copy-2') {
            return Promise.resolve(false);
          }
          return Promise.resolve(true);
        });
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);

      const slug = await service.generateDuplicateSlug('biz-1', 'my-page');
      expect(slug).toBe('my-page-copy-3');
    });
  });

  describe('generateDuplicateName', () => {
    it('appends (کۆپی) to base name', async () => {
      service.isNameAvailable = jest.fn().mockResolvedValue(true);

      const name = await service.generateDuplicateName(
        'biz-1',
        'فرۆشگای سەرەکی',
      );
      expect(name).toBe('فرۆشگای سەرەکی (کۆپی)');
    });

    it('increments already copied name to (کۆپی 2)', async () => {
      service.isNameAvailable = jest.fn().mockResolvedValue(true);

      const name = await service.generateDuplicateName(
        'biz-1',
        'فرۆشگای سەرەکی (کۆپی)',
      );
      expect(name).toBe('فرۆشگای سەرەکی (کۆپی 2)');
    });

    it('increments (کۆپی 2) to (کۆپی 3)', async () => {
      service.isNameAvailable = jest.fn().mockResolvedValue(true);

      const name = await service.generateDuplicateName(
        'biz-1',
        'فرۆشگای سەرەکی (کۆپی 2)',
      );
      expect(name).toBe('فرۆشگای سەرەکی (کۆپی 3)');
    });
  });

  describe('duplicateLinktree limitations', () => {
    let mockDb: {
      query: jest.Mock;
      transaction: jest.Mock;
    };
    let mockEntitlements: {
      getInteger: jest.Mock;
    };
    let mockStorage: {
      claimBusinessAssets: jest.Mock;
      areBusinessAssetsOwned: jest.Mock;
    };
    let mockRedis: {
      del: jest.Mock;
    };
    let templateAccess: { assertAllowed: jest.Mock };

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
        transaction: jest.fn(),
      };
      mockEntitlements = {
        getInteger: jest.fn().mockResolvedValue(-1),
      };
      mockStorage = {
        claimBusinessAssets: jest.fn().mockResolvedValue(undefined),
        areBusinessAssetsOwned: jest.fn().mockResolvedValue(true),
      };
      mockRedis = {
        del: jest.fn().mockResolvedValue(undefined),
      };
      templateAccess = {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
      };

      service = new LinktreesService(
        mockDb as never,
        mockRedis as never,
        mockEntitlements as never,
        templateAccess as never,
        mockStorage as never,
        {} as never,
        {} as never,
      );
    });

    it('suggests and checks slugs only after verifying source ownership', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      await expect(
        service.getDuplicateOptions('foreign', 'owner'),
      ).rejects.toThrow('Source page not found');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('business_id=$2'),
        ['foreign', 'owner'],
      );
      mockDb.query.mockResolvedValue({ rows: [{ seo_name: 'original' }] });
      service.generateDuplicateSlug = jest
        .fn()
        .mockResolvedValue('original-copy-2');
      expect(await service.getDuplicateOptions('source', 'owner')).toEqual({
        slug: 'original-copy-2',
        available: true,
      });
      service.isSlugAvailable = jest.fn().mockResolvedValue(true);
      service.isRootSlugAvailable = jest.fn().mockResolvedValue(false);
      expect(
        await service.getDuplicateOptions('source', 'owner', 'taken'),
      ).toEqual({ slug: 'taken', available: false });
      expect(
        await service.getDuplicateOptions('source', 'owner', 'INVALID'),
      ).toEqual({ slug: 'INVALID', available: false });
    });

    it.each(['business', 'platform'] as const)(
      'saves appearance overrides atomically on the %s copy',
      async (scope) => {
        const source = {
          id: 'source',
          name: 'Original',
          seo_name: 'original',
          template_key: 'spectrum',
          image: '/images/upload/original.png',
          template_config: {
            retained: 'source-setting',
            banner: { enabled: false, mode: 'image', images: [] },
          },
        };
        const snapshot = JSON.stringify(source);
        mockDb.query
          .mockResolvedValue({ rows: [] })
          .mockResolvedValueOnce({ rows: [source] });
        service.isSlugAvailable = jest.fn().mockResolvedValue(true);
        service.isRootSlugAvailable = jest.fn().mockResolvedValue(true);
        const query = jest.fn(async (sql: string, values?: unknown[]) => {
          if (sql.includes('COUNT(*)::int'))
            return { rows: [{ total: 1, copies: 0 }] };
          if (sql.includes('INSERT INTO linktrees'))
            return {
              rows: [{ id: 'copy', name: values?.[1], template_config: {} }],
            };
          return { rows: [] };
        });
        mockDb.transaction.mockImplementation(
          async (
            callback: (client: { query: typeof query }) => Promise<unknown>,
          ) => callback({ query }),
        );
        await service.duplicateLinktree(
          'source',
          'owner',
          {
            headline: 'Different page',
            slug: 'different-page',
            slogan: 'New slogan',
            slogan_color: '#123456',
            description: 'New description',
            background_color: '#161b22',
            background_image: '/images/upload/background.png',
            background_pattern: 'dots',
            template_key: 'frost',
            verification_badge: true,
            banner: {
              enabled: true,
              mode: 'carousel',
              images: ['/images/upload/banner.png'],
            },
          },
          scope,
        );
        const values = query.mock.calls.find(([sql]) =>
          sql.includes('INSERT INTO linktrees'),
        )?.[1];
        expect(values?.slice(1, 5)).toEqual([
          'Different page',
          'New slogan',
          'New description',
          'different-page',
        ]);
        expect(values?.[6]).toBe(source.image);
        expect(values?.[7]).toBe('#161b22');
        expect(values?.[8]).toBe('frost');
        expect(values?.[16]).toBe('#123456');
        expect(JSON.parse(values?.[9] as string)).toMatchObject({
          retained: 'source-setting',
          templateKey: 'frost',
          background_image: '/images/upload/background.png',
          background_pattern: 'dots',
          verification_badge: true,
          banner: {
            enabled: true,
            mode: 'carousel',
            images: ['/images/upload/banner.png'],
          },
          _copy_lineage: { source_id: 'source' },
        });
        expect(mockStorage.areBusinessAssetsOwned).toHaveBeenCalledWith(
          'owner',
          ['/images/upload/banner.png'],
        );
        if (scope === 'business')
          expect(templateAccess.assertAllowed).toHaveBeenCalledWith(
            'owner',
            'frost',
          );
        else expect(templateAccess.assertAllowed).not.toHaveBeenCalled();
        expect(JSON.stringify(source)).toBe(snapshot);
      },
    );

    it.each(['business', 'platform'] as const)(
      'persists an owned replacement logo only on the %s copy',
      async (scope) => {
        const source = {
          id: 'source',
          name: 'Original',
          image: '/images/upload/original.png',
          seo_name: 'original',
          template_config: {},
        };
        mockDb.query.mockResolvedValue({ rows: [] });
        mockDb.query.mockResolvedValueOnce({ rows: [source] });
        service.generateDuplicateSlug = jest
          .fn()
          .mockResolvedValue('original-copy');
        const query = jest.fn(async (sql: string, values?: unknown[]) => {
          if (sql.includes('COUNT(*)::int'))
            return { rows: [{ total: 1, copies: 0 }] };
          if (sql.includes('INSERT INTO linktrees'))
            return {
              rows: [
                {
                  id: 'copy',
                  name: values?.[1],
                  image: values?.[6],
                  template_config: {},
                },
              ],
            };
          return { rows: [] };
        });
        mockDb.transaction.mockImplementation(
          async (
            callback: (client: { query: typeof query }) => Promise<unknown>,
          ) => callback({ query }),
        );
        const result = await service.duplicateLinktree(
          'source',
          'owner',
          { headline: 'Copy', logo: '/images/upload/new.png' },
          scope,
        );
        expect(result.logo).toBe('/images/upload/new.png');
        expect(mockStorage.areBusinessAssetsOwned).toHaveBeenCalledWith(
          'owner',
          '/images/upload/new.png',
        );
        expect(mockStorage.claimBusinessAssets).toHaveBeenCalledWith(
          'owner',
          '/images/upload/new.png',
          expect.objectContaining(source.template_config),
        );
        expect(source.image).toBe('/images/upload/original.png');
        expect(
          query.mock.calls.some(([sql]) => sql.includes('UPDATE linktrees')),
        ).toBe(false);
      },
    );

    it.each(['business', 'platform'] as const)(
      'rejects foreign or unsafe replacement logos before writing a %s copy',
      async (scope) => {
        mockDb.query.mockResolvedValue({
          rows: [{ id: 'source', name: 'Original' }],
        });
        mockStorage.areBusinessAssetsOwned.mockResolvedValue(false);
        for (const logo of [
          '/images/upload/foreign.png',
          '/images/upload/../private.png',
          'https://example.com/logo.png',
        ]) {
          await expect(
            service.duplicateLinktree('source', 'owner', { logo }, scope),
          ).rejects.toThrow('replacement logo');
        }
        expect(mockDb.transaction).not.toHaveBeenCalled();
      },
    );

    it.each(['business', 'platform'] as const)(
      'rejects foreign banner images for a %s copy',
      async (scope) => {
        mockDb.query.mockResolvedValue({ rows: [] }).mockResolvedValueOnce({
          rows: [
            {
              id: 'source',
              name: 'Original',
              seo_name: 'original',
              template_config: {},
            },
          ],
        });
        service.generateDuplicateSlug = jest
          .fn()
          .mockResolvedValue('original-copy');
        mockStorage.areBusinessAssetsOwned.mockResolvedValue(false);
        await expect(
          service.duplicateLinktree(
            'source',
            'owner',
            {
              banner: {
                enabled: true,
                mode: 'image',
                images: ['/images/upload/foreign.png'],
              },
            },
            scope,
          ),
        ).rejects.toThrow('Banner images must belong');
        expect(mockDb.transaction).not.toHaveBeenCalled();
      },
    );

    it('rejects duplicating a page that has reached max nesting depth (depth >= 3)', async () => {
      // Source page at depth 3
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'lt-3',
            name: 'Page 3',
            seo_name: 'page-3',
            template_config: {
              _copy_lineage: {
                depth: 3,
                source_id: 'lt-2',
                origin_id: 'lt-original',
              },
            },
          },
        ],
      });

      await expect(
        service.duplicateLinktree('lt-3', 'biz-1', undefined, 'business'),
      ).rejects.toThrow('ئاستی لەبەرگرتنەوە');
    });

    it('rejects duplicating when source page already has 5 direct copies', async () => {
      // Source page at depth 0
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'lt-orig',
              name: 'Original Page',
              seo_name: 'orig-page',
              template_config: {},
            },
          ],
        })
        // Direct copies query returns count 5
        .mockResolvedValueOnce({
          rows: [{ count: '5' }],
        });

      await expect(
        service.duplicateLinktree('lt-orig', 'biz-1', undefined, 'business'),
      ).rejects.toThrow(
        'ئەم پەڕەیە گەیشتووەتە ئەوپەڕی ژمارەی ڕێگەپێدراوی کۆپیکردنی ڕاستەوخۆ',
      );
    });

    it('allows duplicating when depth < 3 and direct copies < 5', async () => {
      // Source page at depth 1 with 2 direct copies
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'lt-1',
              name: 'Copy 1',
              seo_name: 'copy-1',
              template_config: {
                _copy_lineage: {
                  depth: 1,
                  source_id: 'lt-orig',
                  origin_id: 'lt-orig',
                },
              },
            },
          ],
        })
        // Direct copies query returns count 2
        .mockResolvedValueOnce({
          rows: [{ count: '2' }],
        })
        // Links query
        .mockResolvedValueOnce({ rows: [] })
        // Whatsapp questions query
        .mockResolvedValueOnce({ rows: [] })
        // UID check
        .mockResolvedValueOnce({ rows: [] })
        // mapLinktreeRow questions query
        .mockResolvedValueOnce({ rows: [] });

      service.generateDuplicateSlug = jest
        .fn()
        .mockResolvedValue('copy-1-copy');
      mockDb.transaction.mockImplementation(
        async (cb: (client: { query: jest.Mock }) => Promise<unknown>) => {
          const client = {
            query: jest.fn().mockResolvedValue({
              rows: [
                {
                  id: 'lt-new',
                  name: 'Copy 1',
                  seo_name: 'copy-1-copy',
                },
              ],
            }),
          };
          return cb(client);
        },
      );

      const result = await service.duplicateLinktree(
        'lt-1',
        'biz-1',
        undefined,
        'business',
      );
      expect(result.id).toBe('lt-new');
    });

    it('rejects when another request consumes capacity before the locked copy', async () => {
      mockEntitlements.getInteger.mockResolvedValue(2);
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'lt-orig',
              name: 'Original',
              seo_name: 'original',
              template_config: {},
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValue({ rows: [] });
      service.generateDuplicateSlug = jest
        .fn()
        .mockResolvedValue('original-copy');
      const query = jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 2, copies: 0 }] });
      mockDb.transaction.mockImplementation(
        async (callback: (client: { query: jest.Mock }) => Promise<unknown>) =>
          callback({ query }),
      );
      await expect(
        service.duplicateLinktree('lt-orig', 'biz-1'),
      ).rejects.toThrow('subscription has been reached');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_xact_lock'),
        ['biz-1'],
      );
      expect(query).toHaveBeenCalledTimes(2);
    });
  });
});
