import { TikTokOutboxProcessor } from '../src/analytics/tiktok/tiktok-outbox.processor';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { AnalyticsReadService } from '../src/analytics/analytics-read.service';
import { DatabaseService } from '../src/database/database.service';

const databaseName = `sponsor_krd_notices_test_${process.pid}`;
describe('TikTok notice lifecycle and owner isolation', () => {
  let maintenance: Pool;
  let db: Pool;
  let service: AnalyticsReadService;
  beforeAll(async () => {
    if (!/^sponsor_krd_notices_test_\d+$/.test(databaseName))
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
    await db.query(`
      CREATE TABLE marketing_event_outbox(id text PRIMARY KEY, business_id text, destination_id text, status text);
      CREATE TABLE business_tiktok_pixels(id text PRIMARY KEY, pixel_id text);
      CREATE TABLE marketing_delivery_attempts(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, outbox_id text, attempt_number int, outcome text, status_code int, response_summary text, created_at timestamptz DEFAULT now());
      INSERT INTO marketing_event_outbox VALUES ('a','owner','pixel','retry_scheduled'), ('b','other','pixel','failed_permanently');
      INSERT INTO business_tiktok_pixels VALUES ('pixel','pixel');
    `);
    await db.query(`
      ALTER TABLE marketing_event_outbox ADD COLUMN next_attempt_at timestamptz, ADD COLUMN delivered_at timestamptz, ADD COLUMN locked_at timestamptz, ADD COLUMN last_error text, ADD COLUMN updated_at timestamptz;
      ALTER TABLE marketing_delivery_attempts ADD COLUMN duration_ms integer, ADD COLUMN provider_request_id text, ADD CONSTRAINT unique_attempt UNIQUE(outbox_id, attempt_number);
    `);
    const migration = readFileSync(
      join(
        __dirname,
        '../src/database/migrations/2026-11-09_tiktok_delivery_dismissals.sql',
      ),
      'utf8',
    );
    await db.query(migration);
    await db.query(migration);
    service = new AnalyticsReadService({
      query: db.query.bind(db),
    } as unknown as DatabaseService);
  });
  afterAll(async () => {
    await db?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });
  it('dismisses observed failures, preserves new failures and other owners, and auto-clears recovery', async () => {
    await db.query(
      `INSERT INTO marketing_delivery_attempts(outbox_id,attempt_number,outcome,status_code,response_summary) VALUES ('a',1,'retry',503,'unavailable'),('b',1,'failure',400,'invalid')`,
    );
    const first = await service.getTikTokDeliveryErrors('owner');
    expect(first.items).toHaveLength(1);
    // An attempt arriving after the displayed snapshot must not be hidden.
    await db.query(
      `INSERT INTO marketing_delivery_attempts(outbox_id,attempt_number,outcome,status_code,response_summary) VALUES ('a',2,'retry',504,'timeout')`,
    );
    await service.dismissTikTokDeliveryErrors(
      'owner',
      first.items[0].dismissThrough,
    );
    const current = await service.getTikTokDeliveryErrors('owner');
    expect(current.items).toHaveLength(1);
    expect(current.items[0].statusCode).toBe(504);
    expect(current.items[0].attempts).toBe(2);
    expect((await service.getTikTokDeliveryErrors('other')).items).toHaveLength(
      1,
    );
    await service.dismissTikTokDeliveryErrors(
      'owner',
      current.items[0].dismissThrough,
    );
    expect((await service.getTikTokDeliveryErrors('owner')).items).toEqual([]);
    await db.query(
      `INSERT INTO marketing_delivery_attempts(outbox_id,attempt_number,outcome,status_code,response_summary) VALUES ('a',3,'retry',503,'unavailable')`,
    );
    expect((await service.getTikTokDeliveryErrors('owner')).items).toHaveLength(
      1,
    );
    await db.query(
      "UPDATE marketing_event_outbox SET status='delivered' WHERE id='a'",
    );
    expect((await service.getTikTokDeliveryErrors('owner')).items).toEqual([]);
    expect(
      Number(
        (
          await db.query<{ count: string }>(
            'SELECT count(*) FROM marketing_delivery_attempts',
          )
        ).rows[0].count,
      ),
    ).toBe(4);
  });
  it('records a fresh failure after a manual retry resets the queue attempt counter', async () => {
    const processor = new TikTokOutboxProcessor(
      {
        transaction: async (work: (client: unknown) => Promise<unknown>) =>
          work(db),
      } as unknown as DatabaseService,
      {} as never,
      {} as never,
      { recordWorkerJob: jest.fn() } as never,
      {} as never,
    );
    processor['send'] = jest.fn().mockResolvedValue({
      success: false,
      retryable: true,
      statusCode: 503,
      summary: 'unavailable',
      durationMs: 1,
    });
    const job = {
      id: 'a',
      business_id: 'owner',
      destination_id: 'pixel',
      pixel_id: 'pixel',
      attempt_count: 1,
      encrypted_events_token: Buffer.from('test'),
      payload: {},
    };
    await processor['deliver']([job]);
    const first = await service.getTikTokDeliveryErrors('owner');
    expect(first.items[0].attempts).toBe(4);
    await service.dismissTikTokDeliveryErrors(
      'owner',
      first.items[0].dismissThrough,
    );
    await processor['deliver']([job]);
    const next = await service.getTikTokDeliveryErrors('owner');
    expect(next.items[0].attempts).toBe(5);
    expect(BigInt(next.items[0].dismissThrough)).toBeGreaterThan(
      BigInt(first.items[0].dismissThrough),
    );
  });
});
