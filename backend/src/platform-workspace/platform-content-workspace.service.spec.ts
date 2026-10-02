import { DatabaseService } from '../database/database.service';
import { PlatformContentWorkspaceService } from './platform-content-workspace.service';

describe('Platform content branding', () => {
  it('resolves retired stored assets for public platform Linktrees', async () => {
    const database = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            name: 'Sponsor.krd',
            logo: '/images/Logo.jpg',
            avatar: '/images/sponsor-krd-logo-mark.png',
            favicon: '/favicon.ico',
          },
        ],
      }),
    } as unknown as DatabaseService;
    const service = new PlatformContentWorkspaceService(database);
    await expect(service.getBranding()).resolves.toMatchObject({
      logo: '/images/brand/rise.svg',
      avatar: '/images/brand/rise.svg',
      favicon: '/images/brand/rise-favicon-white.png',
    });
  });

  it('resolves the platform workspace default avatar after a baseline reset', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'platform-owner' }] })
      .mockResolvedValueOnce({
        rows: [{ default_avatar: '/images/sponsor-krd-logo-mark.png' }],
      });
    const service = new PlatformContentWorkspaceService({
      query,
    } as unknown as DatabaseService);
    await expect(service.getLinktreeDefaults()).resolves.toMatchObject({
      default_avatar: '/images/brand/rise.svg',
    });
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'platform-owner',
    ]);
  });
});
