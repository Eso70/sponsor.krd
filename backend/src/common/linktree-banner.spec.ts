import { readLinktreeBanner } from '@linktree/types';
import { assertLinktreeBannerOwnership } from './linktree-banner';
import { spawnSync } from 'node:child_process';

describe('Linktree banner configuration', () => {
  it('loads the shared helper in plain Node without a TypeScript loader', () => {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
      const { readLinktreeBanner } = require('@linktree/types/linktree-banner.cjs');
      process.stdout.write(JSON.stringify(readLinktreeBanner({ enabled: true, images: ['/images/upload/own.png'] })));
    `,
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual({
      enabled: true,
      mode: 'image',
      images: ['/images/upload/own.png'],
    });
  });
  it('defaults off for existing pages and rejects external/traversal/data sources', () => {
    expect(readLinktreeBanner(undefined)).toEqual({
      enabled: false,
      mode: 'image',
      images: [],
    });
    expect(
      readLinktreeBanner({
        enabled: true,
        mode: 'carousel',
        images: [
          'https://other.example/image.png',
          '/images/upload/../secret.png',
          'data:image/png;base64,YQ==',
          '/images/upload/own.png',
        ],
      }),
    ).toEqual({
      enabled: true,
      mode: 'carousel',
      images: ['/images/upload/own.png'],
    });
  });
  it('retains disabled images and caps a carousel at five', () => {
    const banner = readLinktreeBanner({
      enabled: false,
      mode: 'carousel',
      images: Array(6).fill('/images/upload/own.png'),
    });
    expect(banner.enabled).toBe(false);
    expect(banner.images).toHaveLength(5);
  });
  it('checks tenant ownership even for disabled stored banners', async () => {
    const storage = {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(false),
    };
    await expect(
      assertLinktreeBannerOwnership(storage, 'tenant-a', {
        banner: { enabled: false, images: ['/images/upload/tenant-b.png'] },
      }),
    ).rejects.toThrow('Banner images must belong to this business');
    expect(storage.areBusinessAssetsOwned).toHaveBeenCalledWith('tenant-a', [
      '/images/upload/tenant-b.png',
    ]);
    storage.areBusinessAssetsOwned.mockResolvedValue(true);
    await expect(
      assertLinktreeBannerOwnership(storage, 'tenant-a', {
        banner: { images: ['/images/upload/own.png'] },
      }),
    ).resolves.toBeUndefined();
  });
});
