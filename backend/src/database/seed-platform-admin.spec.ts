import { seedPlatformAdmin } from '../../scripts/seed-platform-admin';

describe('seedPlatformAdmin', () => {
  const originalEmail = process.env.PLATFORM_ADMIN_EMAIL;
  const originalUsername = process.env.PLATFORM_ADMIN_USERNAME;
  const originalLogo = process.env.PLATFORM_ADMIN_LOGO_WITH_BACKGROUND;
  const originalFavicon = process.env.PLATFORM_ADMIN_FAVICON;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_EMAIL = 'admin@example.com';
    process.env.PLATFORM_ADMIN_USERNAME = 'configured-admin';
    delete process.env.PLATFORM_ADMIN_LOGO_WITH_BACKGROUND;
    delete process.env.PLATFORM_ADMIN_FAVICON;
  });

  afterAll(() => {
    if (originalEmail === undefined) delete process.env.PLATFORM_ADMIN_EMAIL;
    else process.env.PLATFORM_ADMIN_EMAIL = originalEmail;
    if (originalUsername === undefined)
      delete process.env.PLATFORM_ADMIN_USERNAME;
    else process.env.PLATFORM_ADMIN_USERNAME = originalUsername;
    if (originalLogo === undefined)
      delete process.env.PLATFORM_ADMIN_LOGO_WITH_BACKGROUND;
    else process.env.PLATFORM_ADMIN_LOGO_WITH_BACKGROUND = originalLogo;
    if (originalFavicon === undefined)
      delete process.env.PLATFORM_ADMIN_FAVICON;
    else process.env.PLATFORM_ADMIN_FAVICON = originalFavicon;
  });

  it('updates the existing email identity after its username changes', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'original-admin-id' }] })
      .mockResolvedValueOnce({ rows: [] });

    await seedPlatformAdmin({ query } as never);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE platform_admins SET'),
      expect.arrayContaining(['original-admin-id']),
    );
  });

  it('creates an administrator only when the email has no account', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await seedPlatformAdmin({ query } as never);

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO platform_admins'),
      expect.any(Array),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining([
        '/images/brand/rise.svg',
        '/images/brand/rise-favicon-white.png',
      ]),
    );
  });

  it('refuses to select an arbitrary row when duplicate emails remain', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [{ id: 'first-admin' }, { id: 'second-admin' }],
    });

    await expect(seedPlatformAdmin({ query } as never)).rejects.toThrow(
      'Platform administrator email is duplicated',
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
