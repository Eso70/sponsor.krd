import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { readBaselineSql } from '../src/database/baseline';
import { SessionService } from '../src/auth/session.service';
import { hashSessionToken } from '../src/auth/session-token';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/redis/redis.service';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { removeLegacyPlatformSessionCache } from '../src/auth/legacy-platform-session-cache';
import { cleanupPlatformSessionCache } from '../scripts/cleanup-platform-session-cache';

const databaseName = `sponsor_krd_sessions_test_${process.pid}`;
const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

describe('platform session hashing and replacement with PostgreSQL', () => {
  jest.setTimeout(60_000);
  let maintenance: Pool;
  let db: Pool;
  let adminId: string;
  let service: SessionService;
  const cache = new Map<string, unknown>();
  const redis = {
    get: async (key: string) => cache.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      cache.set(key, value);
      return true;
    },
    del: async (key: string) => cache.delete(key),
    trackBusinessSession: async () => true,
    untrackBusinessSession: async () => true,
  } as unknown as RedisService;

  beforeAll(async () => {
    if (!/^sponsor_krd_sessions_test_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool({
      ...connection,
      database: process.env.DB_MAINTENANCE_NAME || 'postgres',
    });
    await maintenance.query(`CREATE DATABASE "${databaseName}"`);
    db = new Pool({ ...connection, database: databaseName });
    await db.query(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    adminId = (
      await db.query<{ id: string }>(
        "INSERT INTO platform_admins(username,name,email) VALUES('session-test','Test','session@example.test') RETURNING id",
      )
    ).rows[0].id;
    const adapter = {
      query: db.query.bind(db),
      transaction: async <T>(work: (client: PoolClient) => Promise<T>) => {
        const client = await db.connect();
        try {
          await client.query('BEGIN');
          const result = await work(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    } as unknown as DatabaseService;
    service = new SessionService(adapter, redis);
  });
  afterAll(async () => {
    await db?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });
  beforeEach(async () => {
    await db.query(
      'DELETE FROM platform_admin_sessions WHERE platform_admin_id=$1',
      [adminId],
    );
    cache.clear();
  });

  it.each(['raw', 'hashed'] as const)(
    'removes legacy bearer caches with %s database tokens, preserving scoped and unrelated data',
    async (mode) => {
      const prefix = `e2e:legacy-sessions:${randomUUID()}:`;
      const client = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        keyPrefix: prefix,
      });
      const token = 'legacy-valid-browser-token';
      const digest = hashSessionToken(token);
      try {
        await client.set(
          `session:${token}`,
          JSON.stringify({ id: adminId, role: 'platform-admin' }),
        );
        await client.set(`session:${digest}`, 'current hashed cache');
        await client.set(
          'session:business-token',
          JSON.stringify({ id: adminId, role: 'business' }),
        );
        await client.set('session:malformed', '{');
        await client.set('unrelated', 'preserved');
        await client.sadd(
          `business:sessions:${adminId}`,
          digest,
          token,
          ...Array.from({ length: 600 }, (_, i) => `orphan-${i}`),
        );
        for (let i = 0; i < 300; i++)
          await client.set(
            `session:old-${i}`,
            JSON.stringify({ id: adminId, role: 'platform-admin' }),
          );
        const rows = [
          {
            platform_admin_id: adminId,
            session_token: mode === 'raw' ? token : digest,
          },
        ];
        await db.query(
          "INSERT INTO platform_admin_sessions(platform_admin_id,session_token,session_expires_at) VALUES($1,$2,now()+interval '1 hour')",
          [adminId, rows[0].session_token],
        );
        const databaseClient = await db.connect();
        const savedPrefix = process.env.REDIS_KEY_PREFIX;
        try {
          process.env.REDIS_KEY_PREFIX = prefix;
          await cleanupPlatformSessionCache(databaseClient);
        } finally {
          if (savedPrefix === undefined) delete process.env.REDIS_KEY_PREFIX;
          else process.env.REDIS_KEY_PREFIX = savedPrefix;
          databaseClient.release();
        }
        expect(await removeLegacyPlatformSessionCache(client, rows)).toBe(0);
        expect(await client.get(`session:${token}`)).toBeNull();
        expect(await client.smembers(`business:sessions:${adminId}`)).toEqual([
          digest,
        ]);
        expect(await client.get(`session:${digest}`)).toBe(
          'current hashed cache',
        );
        expect(await client.get('session:business-token')).not.toBeNull();
        expect(await client.get('session:malformed')).toBe('{');
        expect(await client.get('unrelated')).toBe('preserved');
        expect(await removeLegacyPlatformSessionCache(client, rows)).toBe(0);
        // Administrators without a database session must also lose stale bearer caches.
        await client.set(
          'session:expired-admin',
          JSON.stringify({ id: adminId, role: 'platform-admin' }),
        );
        expect(
          await removeLegacyPlatformSessionCache(client, [
            { platform_admin_id: adminId, session_token: '' },
          ]),
        ).toBe(1);
      } finally {
        let cursor = '0';
        do {
          const [next, keys] = await client.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            250,
          );
          cursor = next;
          if (keys.length)
            await client.del(...keys.map((key) => key.slice(prefix.length)));
        } while (cursor !== '0');
        client.disconnect();
      }
    },
  );

  it('stops the upgrade before hashing when legacy cache cleanup cannot connect', async () => {
    const token = 'upgrade-must-remain-retryable';
    await db.query(
      "INSERT INTO platform_admin_sessions(platform_admin_id,session_token,session_expires_at) VALUES($1,$2,now()+interval '1 hour')",
      [adminId, token],
    );
    const savedPort = process.env.REDIS_PORT;
    const client = await db.connect();
    try {
      process.env.REDIS_PORT = '1';
      await expect(cleanupPlatformSessionCache(client)).rejects.toThrow(
        'Legacy administrator session cache cleanup failed',
      );
      expect(
        (
          await db.query<{ session_token: string }>(
            'SELECT session_token FROM platform_admin_sessions WHERE platform_admin_id=$1',
            [adminId],
          )
        ).rows[0].session_token,
      ).toBe(token);
    } finally {
      if (savedPort === undefined) delete process.env.REDIS_PORT;
      else process.env.REDIS_PORT = savedPort;
      client.release();
    }
  });

  it('preserves old cookies through an idempotent migration without accepting a digest as a bearer', async () => {
    const token = 'legacy-browser-token';
    await db.query(
      "INSERT INTO platform_admin_sessions(platform_admin_id,session_token,session_expires_at) VALUES($1,$2,now()+interval '1 hour')",
      [adminId, token],
    );
    const sql = readFileSync(
      join(
        __dirname,
        '../src/database/migrations/2026-11-03_platform_session_hashes.sql',
      ),
      'utf8',
    );
    await db.query(sql);
    await db.query(sql);
    const stored = (
      await db.query<{ session_token: string }>(
        'SELECT session_token FROM platform_admin_sessions WHERE platform_admin_id=$1',
        [adminId],
      )
    ).rows[0].session_token;
    expect(stored).toBe(hashSessionToken(token));
    expect(await service.getSessionUser(token)).toMatchObject({
      id: adminId,
      role: 'platform-admin',
    });
    expect(await service.getSessionUser(stored)).toBeNull();
    await service.destroySession(token, {
      id: adminId,
      username: 'session-test',
      name: 'Test',
      role: 'platform-admin',
    });
    expect(await service.getSessionUser(token)).toBeNull();
  });

  it('keeps only one valid hashed session after concurrent sign-ins', async () => {
    const input = {
      platformAdminId: adminId,
      username: 'session-test',
      name: 'Test',
      ipAddress: '127.0.0.1',
      userAgent: 'e2e',
      rememberDevice: true,
    };
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        service.createPlatformAdminSession(input),
      ),
    );
    const rows = (
      await db.query<{ session_token: string }>(
        'SELECT session_token FROM platform_admin_sessions WHERE platform_admin_id=$1',
        [adminId],
      )
    ).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].session_token).toMatch(/^[a-f0-9]{64}$/);
    const live = await Promise.all(
      results.map(({ sessionToken }) => service.getSessionUser(sessionToken)),
    );
    expect(live.filter(Boolean)).toHaveLength(1);
    for (const { sessionToken } of results)
      expect(cache.has(`session:${sessionToken}`)).toBe(false);
  });
});
