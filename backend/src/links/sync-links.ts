import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import type { SyncLinkInput } from './link.types';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SyncLinksDto } from './dto/sync-links.dto';

function linkIdentity(platform: string, url: string): string {
  return `${platform.trim().toLowerCase()}\u0000${url.trim()}`;
}

/** Shared by direct writes, complete editor saves and approved mutations. */
export async function syncLinksInTransaction(
  client: PoolClient,
  linktreeId: string,
  links: SyncLinkInput[],
  businessId: string,
): Promise<void> {
  validateSyncLinks(links);
  const owner = await client.query(
    'SELECT id FROM linktrees WHERE id=$1 AND business_id=$2 FOR UPDATE',
    [linktreeId, businessId],
  );
  if (!owner.rows.length)
    throw new ForbiddenException('You do not own this linktree page');
  const existing = await client.query<{
    id: string;
    platform: string;
    url: string;
  }>(
    `SELECT id, platform, url FROM links
          WHERE linktree_id = $1
          ORDER BY display_order, created_at`,
    [linktreeId],
  );

  // Queued per identity so a page carrying the same destination twice
  // matches them one-for-one instead of collapsing both onto one row.
  const reusable = new Map<string, string[]>();
  for (const row of existing.rows) {
    const key = linkIdentity(row.platform, row.url);
    const queue = reusable.get(key);
    if (queue) queue.push(row.id);
    else reusable.set(key, [row.id]);
  }

  const claimed = new Set<string>();
  const incoming = links || [];

  for (let i = 0; i < incoming.length; i++) {
    const l = incoming[i];
    const metadata = l.metadata || {};
    const url = l.url.trim();
    const params = [
      l.display_name || null,
      l.description || null,
      l.default_message || null,
      i,
      metadata.original_input || null,
      metadata.country_code || null,
      metadata.gps_lat != null ? Number(metadata.gps_lat) : null,
      metadata.gps_lng != null ? Number(metadata.gps_lng) : null,
      metadata.custom_color || null,
      metadata.custom_icon || null,
    ];

    const queue = reusable.get(linkIdentity(l.platform, url));
    const reuseId = queue?.shift();

    if (reuseId) {
      claimed.add(reuseId);
      // The AFTER UPDATE trigger refreshes the matching action row in
      // place, so its id — and everything recorded against it — survives.
      await client.query(
        `UPDATE links SET
               display_name = $1, description = $2, default_message = $3,
               display_order = $4, original_input = $5, country_code = $6,
               gps_lat = $7, gps_lng = $8, custom_color = $9, custom_icon = $10,
               updated_at = NOW()
             WHERE id = $11`,
        [...params, reuseId],
      );
      continue;
    }

    await client.query(
      `INSERT INTO links (
            linktree_id, business_id, platform, url, display_name, description, default_message,
            display_order, original_input, country_code, gps_lat, gps_lng,
            custom_color, custom_icon
          ) VALUES ($11, $12, $13, $14, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [...params, linktreeId, businessId, l.platform, url],
    );
  }

  const removed = existing.rows
    .map((row) => row.id)
    .filter((id) => !claimed.has(id));

  if (removed.length > 0) {
    // Retire their actions explicitly rather than relying only on the
    // BEFORE DELETE trigger: the rows stay for the history that already
    // references them, and archived actions are excluded from the
    // breakdown so they cannot appear beside the surviving buttons.
    await client.query(
      `UPDATE public_page_actions
              SET source_link_id = NULL, status = 'archived', updated_at = NOW()
            WHERE source_link_id = ANY($1::uuid[])`,
      [removed],
    );
    await client.query('DELETE FROM links WHERE id = ANY($1::uuid[])', [
      removed,
    ]);
  }
  await client.query(
    'UPDATE linktrees SET updated_at=NOW() WHERE id=$1 AND business_id=$2',
    [linktreeId, businessId],
  );
}

export function validateSyncLinks(links: SyncLinkInput[]): void {
  const normalized = Array.isArray(links)
    ? links.map((link) =>
        link && typeof link === 'object'
          ? {
              ...link,
              url: typeof link.url === 'string' ? link.url.trim() : link.url,
            }
          : link,
      )
    : links;
  const errors = validateSync(
    plainToInstance(SyncLinksDto, { links: normalized }),
    {
      whitelist: true,
      forbidNonWhitelisted: true,
    },
  );
  if (errors.length)
    throw new BadRequestException('Invalid link synchronization payload');
}
