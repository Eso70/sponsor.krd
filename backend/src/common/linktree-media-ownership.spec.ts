import { ForbiddenException } from '@nestjs/common';
import { assertLinktreeMediaOwnership } from './linktree-banner';

const logo = '/images/upload/sponsor-krd/branding/admin/logo/asset.png';
describe('Linktree media ownership', () => {
  it.each([false, true])(
    'keeps foreign tenant assets forbidden (platform=%s)',
    async (platform) => {
      const storage = {
        areBusinessAssetsOwned: jest.fn().mockResolvedValue(false),
        arePlatformBrandingAssetsOwned: jest.fn().mockResolvedValue(false),
      };
      await expect(
        assertLinktreeMediaOwnership(
          storage,
          'owner',
          {},
          '/images/upload/foreign.png',
          platform,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
  it('allows only platform content to reuse live uploaded administrator branding', async () => {
    const storage = {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(false),
      arePlatformBrandingAssetsOwned: jest.fn().mockResolvedValue(true),
    };
    await expect(
      assertLinktreeMediaOwnership(storage, 'workspace', {}, logo, true),
    ).resolves.toBeUndefined();
    await expect(
      assertLinktreeMediaOwnership(storage, 'business', {}, logo),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('allows owned logo/background alongside the normal banner/SEO checks', async () => {
    const storage = {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(true),
    };
    await expect(
      assertLinktreeMediaOwnership(
        storage,
        'owner',
        { background_image: '/images/upload/background.png' },
        '/images/upload/logo.png',
      ),
    ).resolves.toBeUndefined();
    expect(storage.areBusinessAssetsOwned).toHaveBeenCalledWith(
      'owner',
      '/images/upload/background.png',
    );
    expect(storage.areBusinessAssetsOwned).toHaveBeenCalledWith(
      'owner',
      '/images/upload/logo.png',
    );
  });
});
