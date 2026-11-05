import type { PoolClient } from 'pg';
import Redis from 'ioredis';
import {
  removeLegacyPlatformSessionCache,
  type PlatformSessionCacheOwner,
} from '../src/auth/legacy-platform-session-cache';

/** Invoked on every migration run, including already-hashed installations. */
export async function cleanupPlatformSessionCache(
  client: PoolClient,
): Promise<void> {
  const { rows } = await client.query<PlatformSessionCacheOwner>(
    `SELECT a.id AS platform_admin_id, COALESCE(s.session_token, '') AS session_token
     FROM platform_admins a LEFT JOIN platform_admin_sessions s ON s.platform_admin_id = a.id`,
  );
  if (!rows.length) return;
  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    keyPrefix: process.env.REDIS_KEY_PREFIX || '',
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    retryStrategy: () => null,
  });
  // Awaited commands propagate failures below; never log Redis credential arguments.
  redis.on('error', () => undefined);
  try {
    await redis.connect();
    await removeLegacyPlatformSessionCache(redis, rows);
  } catch {
    throw new Error(
      'Legacy administrator session cache cleanup failed; restore Redis access and rerun migrations with application processes stopped.',
    );
  } finally {
    redis.disconnect();
  }
}
