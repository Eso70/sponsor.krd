import { EntitlementService } from './entitlement.service';

describe('EntitlementService expiry', () => {
  it('refetches an expired cache instead of granting stale paid features', async () => {
    const database = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const redis = {
      get: jest.fn().mockResolvedValue({
        values: { 'feature.tiktok': true },
        end: '2000-01-01',
      }),
      set: jest.fn(),
    };
    const service = new EntitlementService(database as never, redis as never);
    expect(await service.hasFeature('tenant-a', 'feature.tiktok')).toBe(false);
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining('s.current_period_end > NOW()'),
      ['tenant-a'],
    );
  });
  it('uses the tenant-specific cache while its access window remains open', async () => {
    const database = { query: jest.fn() };
    const redis = {
      get: jest.fn().mockResolvedValue({
        values: { 'limit.linktrees': 5 },
        end: '2999-01-01',
      }),
      set: jest.fn(),
    };
    const service = new EntitlementService(database as never, redis as never);
    expect(await service.getInteger('tenant-b', 'limit.linktrees')).toBe(5);
    expect(redis.get).toHaveBeenCalledWith('entitlements:business:tenant-b');
    expect(database.query).not.toHaveBeenCalled();
  });
});
