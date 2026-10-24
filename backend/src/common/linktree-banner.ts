import { ForbiddenException } from '@nestjs/common';
import {
  LINKTREE_BANNER_KEY,
  readLinktreeBanner,
} from '@linktree/types/linktree-banner.cjs';
import type { StorageService } from '../storage/storage.service';
import { normalizeLinktreeSeoConfig, readLinktreeSeo } from './linktree-seo';

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
