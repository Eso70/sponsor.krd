import { BACKGROUND_IMAGE_CONFIG_KEY } from './linktree-background-image';
import { ForbiddenException } from '@nestjs/common';
import {
  LINKTREE_BANNER_KEY,
  readLinktreeBanner,
} from '@linktree/types/linktree-banner.cjs';
import type { StorageService } from '../storage/storage.service';
import { normalizeLinktreeSeoConfig, readLinktreeSeo } from './linktree-seo';
import { readLinktreeSponsor } from '@linktree/types/linktree-sponsor.cjs';

/** Covers direct mutations and field changes executed after approval. */
export async function assertLinktreeBannerOwnership(
  storage: Pick<StorageService, 'areBusinessAssetsOwned'>,
  businessId: string,
  config: Record<string, unknown>,
): Promise<void> {
  normalizeLinktreeSeoConfig(config, true);
  const images = readLinktreeBanner(config[LINKTREE_BANNER_KEY]).images;
  if (
    images.length &&
    !(await storage.areBusinessAssetsOwned(businessId, images))
  ) {
    throw new ForbiddenException('Banner images must belong to this business');
  }
  const socialImage = readLinktreeSeo(config.seo)?.socialImage;
  if (
    socialImage &&
    !(await storage.areBusinessAssetsOwned(businessId, [socialImage]))
  ) {
    throw new ForbiddenException(
      'Social preview image must belong to this business',
    );
  }
}

/** Media ownership policy shared by creates, updates, copies and approvals. */
export async function assertLinktreeMediaOwnership(
  storage: Pick<StorageService, 'areBusinessAssetsOwned'> &
    Partial<Pick<StorageService, 'arePlatformBrandingAssetsOwned'>>,
  businessId: string,
  config: Record<string, unknown>,
  logo?: unknown,
  platformBranding = false,
): Promise<void> {
  await assertLinktreeBannerOwnership(storage, businessId, config);
  const assets = [
    logo,
    config[BACKGROUND_IMAGE_CONFIG_KEY],
    readLinktreeSponsor(config.sponsor).logo,
  ].filter(
    (value): value is string =>
      typeof value === 'string' && value.includes('/images/upload/'),
  );
  for (const asset of assets) {
    if (await storage.areBusinessAssetsOwned(businessId, asset)) continue;
    if (
      platformBranding &&
      (await storage.arePlatformBrandingAssetsOwned?.(asset))
    )
      continue;
    throw new ForbiddenException('Page images must belong to this business');
  }
}
