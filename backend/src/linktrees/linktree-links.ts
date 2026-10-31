import { validateSyncLinks } from '../links/sync-links';
import { BadRequestException } from '@nestjs/common';
import type {
  CreateLinktreeDto,
  LinkMetadataInput,
} from './dto/create-linktree.dto';
import type { SyncLinkInput } from '../links/link.types';
export function buildCreateLinks(data: CreateLinktreeDto) {
  const displayOrders: number[] = [];
  const linksToCreate: Array<{
    platform: string;
    url: string;
    display_name: string | null;
    description: string | null;
    default_message: string | null;
    original_input: string | null;
    country_code: string | null;
    gps_lat: number | null;
    gps_lng: number | null;
    custom_color: string | null;
    custom_icon: string | null;
  }> = [];

  if (data.links === undefined) return linksToCreate;
  if (
    !data.links ||
    typeof data.links !== 'object' ||
    Array.isArray(data.links)
  )
    throw new BadRequestException('Invalid grouped links');
  const groups = Object.entries(data.links);
  if (
    groups.some(
      ([platform, urls]) =>
        !platform.trim() ||
        platform.length > 80 ||
        !Array.isArray(urls) ||
        urls.some((url) => typeof url !== 'string' || !url.trim()),
    ) ||
    groups.reduce((total, [, urls]) => total + urls.length, 0) > 500
  )
    throw new BadRequestException('Invalid grouped links');

  for (const [platformKey, urls] of Object.entries(data.links)) {
    const platform = platformKey.trim();
    if (!platform || !Array.isArray(urls)) continue;

    const metadataRows = Array.isArray(data.linkMetadata?.[platform])
      ? data.linkMetadata?.[platform] || []
      : [];

    urls.forEach((url, index) => {
      if (!url || typeof url !== 'string' || !url.trim()) return;

      const row: LinkMetadataInput = metadataRows[index] || {};
      displayOrders.push(
        typeof row.display_order === 'number' &&
          Number.isSafeInteger(row.display_order) &&
          row.display_order >= 0 &&
          row.display_order <= 32767
          ? row.display_order
          : linksToCreate.length,
      );
      const metadata: Record<string, unknown> =
        row.metadata &&
        typeof row.metadata === 'object' &&
        !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};

      linksToCreate.push({
        platform,
        url: url.trim(),
        display_name:
          typeof row.display_name === 'string' && row.display_name.trim()
            ? row.display_name.trim()
            : null,
        description:
          typeof row.description === 'string' && row.description.trim()
            ? row.description.trim()
            : null,
        default_message:
          typeof row.default_message === 'string'
            ? row.default_message.trim()
            : null,
        original_input:
          typeof metadata.original_input === 'string'
            ? metadata.original_input
            : null,
        country_code:
          typeof metadata.country_code === 'string'
            ? metadata.country_code
            : null,
        gps_lat:
          metadata.gps_lat !== undefined && metadata.gps_lat !== null
            ? Number(metadata.gps_lat)
            : null,
        gps_lng:
          metadata.gps_lng !== undefined && metadata.gps_lng !== null
            ? Number(metadata.gps_lng)
            : null,
        custom_color:
          typeof metadata.custom_color === 'string'
            ? metadata.custom_color
            : null,
        custom_icon:
          typeof metadata.custom_icon === 'string'
            ? metadata.custom_icon
            : null,
      });
    });
  }

  return linksToCreate
    .map((link, index) => ({ link, order: displayOrders[index] ?? index }))
    .sort((a, b) => a.order - b.order)
    .map(({ link }) => link);
}

/**
 * Converts the editor's grouped link payload to the canonical sync shape.
 * Platform administration uses the same mapping as business creation so
 * metadata, phone inputs, GPS values, labels, and descriptions cannot drift.
 */
export function buildSyncLinks(data: CreateLinktreeDto): SyncLinkInput[] {
  const links = buildCreateLinks(data).map((link) => ({
    platform: link.platform,
    url: link.url,
    display_name: link.display_name,
    description: link.description,
    default_message: link.default_message,
    metadata: {
      original_input: link.original_input,
      country_code: link.country_code,
      gps_lat: link.gps_lat,
      gps_lng: link.gps_lng,
      custom_color: link.custom_color,
      custom_icon: link.custom_icon,
    },
  }));
  validateSyncLinks(links);
  return links;
}
