import type { ConfigService } from '@nestjs/config';
import type { DatabaseService } from '../database/database.service';
import { buildTenantUrl } from './root-domain';

/** Use only live, database-owned hostnames; never a client return URL. */
export async function selectedTenantUrl(
  database: DatabaseService,
  config: ConfigService,
  baseUrl: string,
  subdomain: string,
  path: string,
): Promise<string> {
  if (String(config.get('CUSTOM_DOMAINS_ENABLED', 'false')) === 'true') {
    const result = await database.query<{ hostname: string }>(
      `SELECT d.hostname FROM business_domains d
       JOIN businesses b ON b.id=d.business_id
       WHERE b.subdomain=$1 AND b.status='active' AND b.account_type='business'
         AND d.is_primary AND d.status='active' AND d.valid_until>now()`,
      [subdomain],
    );
    if (result.rows[0])
      return new URL(path, `https://${result.rows[0].hostname}`).toString();
  }
  return buildTenantUrl(baseUrl, subdomain, path);
}
