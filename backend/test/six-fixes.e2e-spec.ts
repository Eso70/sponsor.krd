import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { readBaselineSql } from '../src/database/baseline';
import { applyForwardMigrations } from '../src/database/forward-migrations';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/redis/redis.service';
import { PublicFormsController } from '../src/forms/public-forms.controller';
import { FormsService } from '../src/forms/forms.service';
import { BusinessAdministrationService } from '../src/platform-admin/business-administration.service';
import { AuthService } from '../src/auth/auth.service';
import { ApprovalService } from '../src/auth/approval.service';
import { SecretCryptoService } from '../src/auth/secret-crypto.service';
import { TikTokPixelConfigService } from '../src/auth/tiktok-pixel-config.service';
import { PlatformContentWorkspaceService } from '../src/platform-workspace/platform-content-workspace.service';
import { PlatformSettingsService } from '../src/platform-admin/platform-settings.service';

const databaseName = `sponsor_krd_six_fixes_test_${process.pid}`;

describe('remaining audit fixes with PostgreSQL, Redis and HTTP', () => {
  jest.setTimeout(60_000);
  let maintenance: Pool;
  let db: Pool;
  let adapter: DatabaseService;
  let redis: RedisService;
  let owner: string;
  let foreignOwner: string;
  let admin: string;
  let pixels: TikTokPixelConfigService;
  let auth: AuthService;
  let approvals: ApprovalService;
  let platform: PlatformSettingsService;
  let groupLimit = 3;
  const prefix = `e2e:six-fixes:${randomUUID()}:`;
  const config = new ConfigService({
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
    REDIS_KEY_PREFIX: prefix,
    SESSION_SECRET: 'six-fixes-encryption-test-secret',
  });

  beforeAll(async () => {
    if (!/^sponsor_krd_six_fixes_test_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    const connection = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
    maintenance = new Pool({
      ...connection,
      database: process.env.DB_MAINTENANCE_NAME || 'postgres',
    });
    await maintenance.query(`CREATE DATABASE "${databaseName}"`);
    db = new Pool({ ...connection, database: databaseName });
    const migrations = join(__dirname, '../src/database/migrations');
    await db.query(readBaselineSql(migrations));
    const client = await db.connect();
    try {
      await applyForwardMigrations(client, migrations);
    } finally {
      client.release();
    }
    adapter = {
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
    const owners = await db.query<{ id: string }>(
      "INSERT INTO businesses(username,name,phone,subdomain) VALUES('six-owner','Owner','101','six-owner'),('six-other','Other','102','six-other') RETURNING id",
    );
    [owner, foreignOwner] = owners.rows.map((row) => row.id);
    admin = (
      await db.query<{ id: string }>(
        "INSERT INTO platform_admins(username,name) VALUES('six-admin','Administrator') RETURNING id",
      )
    ).rows[0].id;
    redis = new RedisService(config);
    redis.onModuleInit();
    if (redis.getClient().status !== 'ready')
      await new Promise<void>((resolve) =>
        redis.getClient().once('ready', resolve),
      );
    const crypto = new SecretCryptoService(config);
    pixels = new TikTokPixelConfigService(adapter, crypto, config);
    const storage = {
      claimBusinessAssets: async () => undefined,
      deleteUnreferencedFromValues: async () => undefined,
    };
    auth = new AuthService(
      adapter,
      redis,
      { getInteger: async () => groupLimit } as never,
      undefined,
      storage as never,
      pixels,
    );
    approvals = new ApprovalService(
      adapter,
      {
        authorize: async () => ({ outcome: 'approval' }),
        invalidateBusinessPolicy: async () => undefined,
      } as never,
      crypto,
      storage as never,
      redis,
      undefined,
      pixels,
      { getInteger: async () => groupLimit } as never,
    );
    await db.query(
      "INSERT INTO businesses(username,name,phone,account_type) SELECT 'six-platform','Platform','103','platform' WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE account_type='platform')",
    );
    platform = new PlatformSettingsService(
      adapter,
      redis,
      config,
      undefined,
      new PlatformContentWorkspaceService(adapter),
      pixels,
      {} as never,
    );
  });

  afterAll(async () => {
    if (redis) {
      await redis.deleteByPattern('*');
      redis.onModuleDestroy();
    }
    await db?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });

  it('keeps counters expiring across concurrent requests, rollover and legacy orphan repair', async () => {
    const client = redis.getClient();
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        redis.isRateLimited('parallel', 10, 60, { failClosed: true }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(10);
    const initialTtl = await client.pttl('parallel');
    await redis.isRateLimited('parallel', 10, 60);
    expect(await client.pttl('parallel')).toBeLessThanOrEqual(initialTtl);
    await client.set('rollover', '10', 'PX', 20);
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(await redis.isRateLimited('rollover', 10, 60)).toBe(false);
    expect(await client.ttl('rollover')).toBeGreaterThan(0);
    await client.set('orphan', '5');
    expect(await redis.isRateLimited('orphan', 10, 60)).toBe(false);
    expect(await client.ttl('orphan')).toBeGreaterThan(0);
  });

  it('returns HTTP 429 at the submission limit and HTTP 503 without executing a submission after cache failure', async () => {
    const submit = jest.fn(async () => ({ accepted: true }));
    const httpRedis = new RedisService(
      new ConfigService({
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
        REDIS_KEY_PREFIX: `${prefix}http:`,
      }),
    );
    const module = await Test.createTestingModule({
      controllers: [PublicFormsController],
      providers: [
        { provide: RedisService, useValue: httpRedis },
        { provide: FormsService, useValue: { submit } },
      ],
    }).compile();
    const app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    try {
      await app.init();
      if (httpRedis.getClient().status !== 'ready')
        await new Promise<void>((resolve) =>
          httpRedis.getClient().once('ready', resolve),
        );
      for (let i = 0; i < 10; i++)
        expect(
          (
            await app.inject({
              method: 'POST',
              url: '/api/public/forms/sample/submissions',
              payload: {},
            })
          ).statusCode,
        ).toBe(201);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/public/forms/sample/submissions',
            payload: {},
          })
        ).statusCode,
      ).toBe(429);
      httpRedis.getClient().disconnect();
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/public/forms/sample/submissions',
            payload: {},
          })
        ).statusCode,
      ).toBe(503);
      expect(submit).toHaveBeenCalledTimes(10);
    } finally {
      await app.close();
    }
  });

  it('uses the same group preservation, token encryption and owner isolation for direct, approved, onboarding and platform updates', async () => {
    await auth.updateBusinessSettings(owner, {
      section: 'integrations',
      tiktok_configs: [
        { pixel_id: 'PIXEL_FIRST', events_token: 'first-secret' },
      ],
    });
    const first = (await pixels.list(owner))[0];
    groupLimit = 1;
    const oversized = [
      { id: first.id, pixel_id: 'PIXEL_FIRST', keep_events_token: true },
      { pixel_id: 'PIXEL_SECOND' },
    ];
    await expect(
      auth.updateBusinessSettings(owner, {
        section: 'integrations',
        tiktok_configs: oversized,
      }),
    ).rejects.toMatchObject({ status: 403 });
    const overLimit = await approvals.create({
      businessId: owner,
      permission: 'business:tiktok:update',
      action: 'update',
      changes: { tiktok_configs: oversized },
      decision: { outcome: 'approval' } as never,
    });
    await expect(
      approvals.review({ id: overLimit.id, actorId: admin, action: 'approve' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(await pixels.list(owner)).toHaveLength(1);
    groupLimit = 3;

    await expect(
      auth.updateBusinessSettings(owner, {
        section: 'integrations',
        tiktok_configs: [],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      auth.updateBusinessOnboarding(owner, { step: 2, tiktokConfigs: [] }),
    ).rejects.toMatchObject({ status: 400 });
    const pending = await approvals.create({
      businessId: owner,
      permission: 'business:tiktok:update',
      action: 'update',
      changes: { tiktok_configs: [] },
      decision: { outcome: 'approval' } as never,
    });
    await expect(
      approvals.review({ id: pending.id, actorId: admin, action: 'approve' }),
    ).rejects.toMatchObject({ status: 400 });
    const replacement = await approvals.create({
      businessId: owner,
      permission: 'business:tiktok:update',
      action: 'update',
      changes: {
        tiktok_configs: [
          { id: first.id, pixel_id: 'PIXEL_FIRST', keep_events_token: true },
        ],
      },
      decision: { outcome: 'approval' } as never,
    });
    await expect(
      approvals.review({
        id: replacement.id,
        actorId: admin,
        action: 'approve',
      }),
    ).resolves.toMatchObject({ status: 'approved' });
    expect((await pixels.getSecret(owner, first.id)).events_token).toBe(
      'first-secret',
    );
    await auth.updateBusinessOnboarding(owner, {
      step: 2,
      tiktokConfigs: [
        {
          id: first.id,
          pixel_id: 'PIXEL_FIRST',
          events_token: 'updated-secret',
        },
      ],
    });
    expect((await auth.getTikTokSecret(owner, first.id)).events_token).toBe(
      'updated-secret',
    );
    await expect(
      pixels.getSecret(foreignOwner, first.id),
    ).rejects.toMatchObject({ status: 400 });
    const platformSettings = await platform.updateTikTokSettings([
      { pixel_id: 'PLATFORM_PIXEL', events_token: 'platform-secret' },
    ]);
    await expect(platform.updateTikTokSettings([])).rejects.toMatchObject({
      status: 400,
    });
    expect(platformSettings.tiktok_configs[0].id).not.toBe(first.id);
    expect((await pixels.list(owner))[0].id).toBe(first.id);
    const stored = (
      await db.query<{ encrypted_events_token: Buffer }>(
        'SELECT encrypted_events_token FROM business_tiktok_pixels WHERE id=$1',
        [first.id],
      )
    ).rows[0];
    expect(
      stored.encrypted_events_token.includes(Buffer.from('updated-secret')),
    ).toBe(false);
  });

  it('rolls back dependent communication removal on failed deletion and deletes only the requested tenant on retry', async () => {
    const conversations: string[] = [];
    for (const business of [owner, foreignOwner]) {
      const conversation = (
        await db.query<{ id: string }>(
          "INSERT INTO communication_conversations(business_id,subject,created_by_type) VALUES($1,'Conversation','business') RETURNING id",
          [business],
        )
      ).rows[0].id;
      conversations.push(conversation);
      await db.query(
        "INSERT INTO communication_messages(conversation_id,sender_type,sender_business_id,body) VALUES($1,'business',$2,'Message')",
        [conversation, business],
      );
      await db.query(
        "INSERT INTO communication_notifications(recipient_type,platform_admin_id,kind,title,body,source_type,source_id) VALUES('platform-admin',$1,'message','Message','Message','conversation',$2)",
        [admin, conversation],
      );
    }
    const cache = { clearBusinessSessions: jest.fn(), del: jest.fn() };
    const service = new BusinessAdministrationService(
      adapter,
      cache as never,
      {
        getBusinessAssetUrls: async () => [],
        deleteUnreferencedFromValues: async () => undefined,
      } as never,
    );
    await db.query(
      "CREATE FUNCTION reject_fixture_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fixture deletion failure'; END $$; CREATE TRIGGER reject_fixture_delete BEFORE DELETE ON businesses FOR EACH ROW EXECUTE FUNCTION reject_fixture_delete()",
    );
    await expect(service.deleteBusiness(owner, admin)).rejects.toThrow(
      'Fixture deletion failure',
    );
    expect(
      (
        await db.query(
          'SELECT id FROM communication_conversations WHERE id=$1',
          [conversations[0]],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          'SELECT id FROM communication_messages WHERE conversation_id=$1',
          [conversations[0]],
        )
      ).rows,
    ).toHaveLength(1);
    expect(cache.clearBusinessSessions).not.toHaveBeenCalled();
    await db.query(
      'DROP TRIGGER reject_fixture_delete ON businesses; DROP FUNCTION reject_fixture_delete()',
    );
    await expect(service.deleteBusiness(owner, admin)).resolves.toMatchObject({
      success: true,
    });
    expect(
      (await db.query('SELECT id FROM businesses WHERE id=$1', [owner])).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          'SELECT id FROM communication_messages WHERE conversation_id=$1',
          [conversations[0]],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          'SELECT id FROM communication_notifications WHERE source_id=$1',
          [conversations[0]],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          'SELECT id FROM communication_messages WHERE conversation_id=$1',
          [conversations[1]],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          'SELECT id FROM communication_notifications WHERE source_id=$1',
          [conversations[1]],
        )
      ).rows,
    ).toHaveLength(1);
  });
});
