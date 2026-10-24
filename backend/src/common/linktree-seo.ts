import { isDeepStrictEqual } from 'node:util';
import { featurePlanSql } from '../billing/feature-plan-policy';
import type { DatabaseService } from '../database/database.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  inspectLinktreeSeo,
  readLinktreeSeo,
} from '@linktree/types/linktree-seo.cjs';

/** Validate only the versioned settings owned by the shared editor. */
export function normalizeLinktreeSeoConfig(
  config: Record<string, unknown>,
  validate = false,
): void {
  const result = inspectLinktreeSeo(config.seo);
  if (validate && Object.keys(result.errors).length)
    throw new BadRequestException('Invalid Linktree SEO settings');
  if (result.value) config.seo = result.value;
  else delete config.seo;
}
export { readLinktreeSeo };

/** Old clients may omit paid settings during an unrelated edit; retain the stored data. */
export function linktreeSeoWriteChanged(
  config: Record<string, unknown>,
  previous?: Record<string, unknown>,
): boolean {
  const before = readLinktreeSeo(previous?.seo);
  const after = readLinktreeSeo(config.seo);
  if (before && !after) {
    config.seo = before;
    return false;
  }
  if (!before && (!after || Object.keys(after).length === 1)) return false;
  return !isDeepStrictEqual(before, after);
}

/** Shared by direct writes and approval execution; a custom grant cannot bypass Max. */
export async function assertLinktreeSeoPlan(
  database: Pick<DatabaseService, 'query'>,
  businessId: string,
  config: Record<string, unknown>,
  previous?: Record<string, unknown>,
): Promise<void> {
  if (!linktreeSeoWriteChanged(config, previous)) return;
  const result = await database.query<{ allowed: boolean }>(
    `SELECT ${featurePlanSql('linktree-seo', 'a')} AS allowed FROM businesses a WHERE a.id=$1`,
    [businessId],
  );
  if (result.rows[0]?.allowed !== true)
    throw new ForbiddenException('Advanced Linktree SEO requires the Max plan');
}
