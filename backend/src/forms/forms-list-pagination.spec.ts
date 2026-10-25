import { FormsService } from './forms.service';
import type { DatabaseService } from '../database/database.service';
import type { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import type { StorageService } from '../storage/storage.service';
import type { UnifiedAnalyticsService } from '../analytics/unified-analytics.service';
import type { PublicPageAnalyticsService } from '../analytics/public-page-analytics.service';

describe('owner-scoped form collection pagination', () => {
  it.each([0, 1, 2])(
    'fetches fifteen summaries at the correct offset on page %s',
    async (page) => {
      const items = [{ id: 'saved-form' }];
      const query = jest
        .fn<Promise<{ rows: unknown[] }>, [sql: string, values: unknown[]]>()
        .mockResolvedValueOnce({ rows: items })
        .mockResolvedValueOnce({ rows: [{ total: '31' }] });
      const service = new FormsService(
        { query } as unknown as DatabaseService,
        {} as PlatformContentWorkspaceService,
        {} as StorageService,
        {} as UnifiedAnalyticsService,
        {} as PublicPageAnalyticsService,
      );
      const result = await service.list('owner-id', page, 'contact', true);
      expect(result).toEqual({ items, total: 31 });
      expect(query.mock.calls[0][0]).toContain('LIMIT 15 OFFSET $4');
      expect(query.mock.calls[0][0]).toContain('AS "bannerImages"');
      expect(query.mock.calls[0][0]).toContain('AS "bannerMode"');
      expect(query.mock.calls[0][0]).toContain(
        "definition->>'bannerEnabled' = 'false'",
      );
      expect(query.mock.calls[0][1].slice(0, 4)).toEqual([
        'owner-id',
        true,
        '%contact%',
        page * 15,
      ]);
      expect(query.mock.calls[1][1]).toEqual(['owner-id', true, '%contact%']);
    },
  );
  it('selects only IDs using the same escaped owner/search/archive predicate as the list', async () => {
    const query = jest
      .fn()
      .mockResolvedValue({ rows: [{ id: 'first' }, { id: 'second' }] });
    const service = new FormsService(
      { query } as unknown as DatabaseService,
      {} as PlatformContentWorkspaceService,
      {} as StorageService,
      {} as UnifiedAnalyticsService,
      {} as PublicPageAnalyticsService,
    );
    expect(await service.selectionIds('owner', 'contact%', true)).toEqual([
      'first',
      'second',
    ]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'SELECT id FROM forms WHERE business_id=$1 AND is_archived=$2::boolean AND name ILIKE $3',
      ),
      ['owner', true, '%contact\\%%'],
    );
  });
});
