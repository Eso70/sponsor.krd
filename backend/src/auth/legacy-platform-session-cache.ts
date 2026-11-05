import type Redis from 'ioredis';
import { hashSessionToken } from './session-token';

export interface PlatformSessionCacheOwner {
  platform_admin_id: string;
  session_token: string;
}

const HASH = /^[0-9a-f]{64}$/;

/** Run with application writers stopped; preserve hashed and unrelated keys. */
export async function removeLegacyPlatformSessionCache(
  redis: Redis,
  sessions: readonly PlatformSessionCacheOwner[],
): Promise<number> {
  const prefix = redis.options.keyPrefix || '';
  const owners = new Set(sessions.map((session) => session.platform_admin_id));
  const tokenOwners = new Map(
    sessions.map((session) => [
      HASH.test(session.session_token)
        ? session.session_token
        : hashSessionToken(session.session_token),
      session.platform_admin_id,
    ]),
  );
  let removed = 0;
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${prefix}session:*`,
      'COUNT',
      250,
    );
    cursor = next;
    for (const physicalKey of keys) {
      if (!physicalKey.startsWith(`${prefix}session:`)) continue;
      const key = physicalKey.slice(prefix.length);
      const token = key.slice('session:'.length);
      if (!token || HASH.test(token)) continue;
      let owner = tokenOwners.get(hashSessionToken(token));
      if (!owner) {
        const value = await redis.get(key);
        if (!value) continue;
        try {
          const cached: unknown = JSON.parse(value);
          if (
            cached &&
            typeof cached === 'object' &&
            'role' in cached &&
            cached.role === 'platform-admin' &&
            'id' in cached &&
            typeof cached.id === 'string' &&
            owners.has(cached.id)
          )
            owner = cached.id;
        } catch {
          /* A malformed unrelated cache value is not proof of ownership. */
        }
      }
      if (!owner) continue;
      removed += await redis.del(key);
      await redis.srem(`business:sessions:${owner}`, token);
    }
  } while (cursor !== '0');

  for (const owner of owners) {
    const key = `business:sessions:${owner}`;
    let memberCursor = '0';
    do {
      const [next, members] = await redis.sscan(
        key,
        memberCursor,
        'COUNT',
        250,
      );
      memberCursor = next;
      const legacy = members.filter((member) => !HASH.test(member));
      if (legacy.length) await redis.srem(key, ...legacy);
    } while (memberCursor !== '0');
  }
  return removed;
}
