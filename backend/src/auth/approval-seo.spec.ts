import { ApprovalService } from './approval.service';

describe('approved SEO cache lifecycle', () => {
  it.each([true, false])(
    'requires live Max access before committing approved SEO (allowed=%s)',
    async (allowed) => {
      let committed = false;
      const query = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('AS allowed FROM businesses'))
          return Promise.resolve({ rows: [{ allowed }] });
        if (sql.includes('FROM linktrees WHERE id=$1'))
          return Promise.resolve({
            rows: [
              {
                id: 'page',
                name: 'Page',
                template_config: {},
                template_key: 'spectrum',
                uid: 'page-uid',
                seo_name: 'old-slug',
              },
            ],
          });
        if (sql.includes('UPDATE linktrees'))
          return Promise.resolve({
            rows: [{ id: 'page', uid: 'page-uid', seo_name: 'new-slug' }],
          });
        if (sql.includes('FOR UPDATE'))
          return Promise.resolve({
            rows: [
              {
                business_id: 'owner',
                permission_key: 'business:linktrees:update',
                resource_id: 'page',
                resource_type: 'linktree',
                requested_changes: {
                  template_config: {
                    seo: { version: 1, category: 'food', indexing: 'noindex' },
                  },
                  seo_name: 'new-slug',
                },
              },
            ],
          });
        if (sql.includes('lt.logo AS image'))
          return Promise.resolve({
            rows: [
              {
                image: null,
                template_config: {},
                uid: 'page-uid',
                seo_name: 'old-slug',
                subdomain: 'OWNER',
              },
            ],
          });
        return Promise.resolve({ rows: [] });
      });
      const redis = {
        del: jest.fn().mockImplementation(() => {
          expect(committed).toBe(true);
          return Promise.resolve(1);
        }),
      };
      const service = new ApprovalService(
        {
          transaction: async (
            work: (client: { query: typeof query }) => Promise<unknown>,
          ) => {
            const result = await work({ query });
            committed = true;
            return result;
          },
        } as never,
        {
          authorize: jest.fn().mockResolvedValue({ outcome: 'approval' }),
          invalidateBusinessPolicy: jest.fn(),
        } as never,
        {} as never,
        {
          claimBusinessAssets: jest.fn(),
          deleteUnreferencedFromValues: jest.fn(),
        } as never,
        redis as never,
        { assertAllowed: jest.fn() } as never,
      );
      const review = service.review({
        id: 'approval',
        action: 'approve',
        actorId: 'admin',
      });
      if (!allowed) {
        await expect(review).rejects.toThrow(
          'Advanced Linktree SEO requires the Max plan',
        );
        expect(redis.del).not.toHaveBeenCalled();
        return;
      }
      await review;
      for (const id of ['page-uid', 'old-slug', 'new-slug']) {
        expect(redis.del).toHaveBeenCalledWith(
          `cache:linktree:uid:${id}:sub:owner`,
        );
        expect(redis.del).toHaveBeenCalledWith(`cache:platform-linktree:${id}`);
      }
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id=$1 AND business_id=$2 FOR UPDATE'),
        ['page', 'owner'],
      );
    },
  );
});
