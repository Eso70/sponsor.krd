import { ConfigService } from '@nestjs/config';
import type { DatabaseService } from '../database/database.service';
import { selectedTenantUrl } from './selected-tenant-url';

describe('selected tenant authentication destination', () => {
  const query = jest.fn();
  const database = { query } as unknown as DatabaseService;
  const config = new ConfigService({ CUSTOM_DOMAINS_ENABLED: true });
  it('uses a live primary hostname and preserves the one-use query', async () => {
    query.mockResolvedValue({ rows: [{ hostname: 'zhirsaz.com' }] });
    expect(
      await selectedTenantUrl(
        database,
        config,
        'https://sponsor.krd',
        'eso',
        '/business/auth/consume?code=one-use',
      ),
    ).toBe('https://zhirsaz.com/business/auth/consume?code=one-use');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('d.valid_until>now()'),
      ['eso'],
    );
  });
  it('restores the default login origin after removal or expiry', async () => {
    query.mockResolvedValue({ rows: [] });
    expect(
      await selectedTenantUrl(
        database,
        config,
        'https://sponsor.krd',
        'eso',
        '/business',
      ),
    ).toBe('https://eso.sponsor.krd/business');
  });
  it('does not look up domains when the feature is disabled', async () => {
    query.mockClear();
    await selectedTenantUrl(
      database,
      new ConfigService(),
      'http://localhost:3011',
      'eso',
      '/business',
    );
    expect(query).not.toHaveBeenCalled();
  });
});
