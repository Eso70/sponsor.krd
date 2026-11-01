import { NotFoundException } from '@nestjs/common';
import type { DatabaseService } from '../database/database.service';

export async function pinOwnedPage(
  database: Pick<DatabaseService, 'query'>,
  table: 'linktrees' | 'forms',
  owner: string,
  id: string,
  isPinned: boolean,
) {
  const result = await database.query<{ id: string; isPinned: boolean }>(
    `UPDATE ${table} SET is_pinned=$3 WHERE business_id=$1 AND id=$2 RETURNING id,is_pinned AS "isPinned"`,
    [owner, id, isPinned],
  );
  if (!result.rows[0])
    throw new NotFoundException(
      table === 'forms' ? 'Form not found' : 'Linktree page not found',
    );
  return result.rows[0];
}
