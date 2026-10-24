import { NotFoundException } from '@nestjs/common';
import { FormsService } from './forms.service';
import type { DatabaseService } from '../database/database.service';
import type { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import type { StorageService } from '../storage/storage.service';
import type { UnifiedAnalyticsService } from '../analytics/unified-analytics.service';
import type { PublicPageAnalyticsService } from '../analytics/public-page-analytics.service';

function fixture(owned = true, tracked = true) {
  const client = {
    query: jest
      .fn<
        Promise<{ rows: { id: string }[] }>,
        [sql: string, values: string[]]
      >()
      .mockResolvedValueOnce({ rows: owned ? [{ id: 'form' }] : [] })
      .mockResolvedValueOnce({ rows: tracked ? [{ id: 'page' }] : [] }),
  };
  const db = {
    transaction: jest.fn(async (run: (client: unknown) => Promise<void>) =>
      run(client),
    ),
  };
  const analytics = { clear: jest.fn().mockResolvedValue(undefined) };
  const service = new FormsService(
    db as unknown as DatabaseService,
    {} as PlatformContentWorkspaceService,
    {} as StorageService,
    analytics as unknown as UnifiedAnalyticsService,
    {} as PublicPageAnalyticsService,
  );
  return { client, analytics, service };
}
describe('analytics-only form deletion', () => {
  it('locks the owned form and clears only its tracking in the same transaction', async () => {
    const { service, client, analytics } = fixture();
    await service.clearAnalytics('owner', 'form');
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('business_id=$1 AND id=$2 FOR UPDATE'),
      ['owner', 'form'],
    );
    expect(analytics.clear).toHaveBeenCalledWith('owner', 'form', client);
    expect(
      client.query.mock.calls.every(([sql]) => sql.startsWith('SELECT')),
    ).toBe(true);
  });
  it('rejects a foreign or missing form before clearing any analytics', async () => {
    const { service, analytics } = fixture(false);
    await expect(
      service.clearAnalytics('owner', 'foreign'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(analytics.clear).not.toHaveBeenCalled();
  });
  it('accepts owned forms with no tracking yet as a no-op', async () => {
    const { service, analytics } = fixture(true, false);
    await service.clearAnalytics('owner', 'form');
    expect(analytics.clear).not.toHaveBeenCalled();
  });
});
