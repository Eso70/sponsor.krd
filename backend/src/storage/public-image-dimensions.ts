import type { PublicImageDimensions } from '@linktree/types';
import type { DatabaseService } from '../database/database.service';

/** Read only dimensions of published-page media belonging to that page's owner. */
export async function publicImageDimensions(
  database: DatabaseService,
  pageType: 'linktree' | 'form',
  pageId: string,
  sources: string[],
): Promise<PublicImageDimensions> {
  const urls = [...new Set(sources)].filter((url) =>
    url.startsWith('/images/upload/'),
  );
  if (!urls.length) return {};
  const sourceColumn =
    pageType === 'form' ? 'source_form_id' : 'source_linktree_id';
  const result = await database.query<{
    public_url: string;
    width: number;
    height: number;
  }>(
    `SELECT asset.public_url, asset.width, asset.height
       FROM uploaded_media_assets asset
       JOIN public_pages page ON page.business_id=asset.owner_business_id
      WHERE page.${sourceColumn}=$1 AND asset.public_url=ANY($2::text[])
        AND asset.width > 0 AND asset.height > 0`,
    [pageId, urls],
  );
  return Object.fromEntries(
    result.rows.map(({ public_url, width, height }) => [
      public_url,
      { width, height },
    ]),
  );
}
