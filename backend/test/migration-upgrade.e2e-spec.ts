import { spawnSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import {
  BASELINE_LEDGER_NAME,
  readBaselineSql,
} from '../src/database/baseline';

const DATABASE_PREFIX = 'sponsor_krd_migration_e2e_';
const fixtureDatabase = `${DATABASE_PREFIX}${process.pid}`;
const migrationsDirectory = join(__dirname, '../src/database/migrations');
function connection(database: string) {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
  };
}

function quotedDatabase(name: string): string {
  if (!name.startsWith(DATABASE_PREFIX) || !/^[a-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe migration fixture database name: ${name}`);
  }
  return `"${name}"`;
}

describe('consolidated database schema commands (e2e)', () => {
  jest.setTimeout(120_000);
  let maintenance: Pool;
  let fixture: Pool;

  beforeAll(async () => {
    const sourceDatabase = process.env.DB_NAME || '';
    if (!/(?:^|[_-])(e2e|test)(?:[_-]|$)/i.test(sourceDatabase)) {
      throw new Error(
        `Refusing migration E2E setup for DB_NAME=${sourceDatabase || '<empty>'}`,
      );
    }
    maintenance = new Pool(
      connection(process.env.DB_MAINTENANCE_NAME || 'postgres'),
    );
    await maintenance.query(
      `DROP DATABASE IF EXISTS ${quotedDatabase(fixtureDatabase)}`,
    );
    await maintenance.query(
      `CREATE DATABASE ${quotedDatabase(fixtureDatabase)}`,
    );
    fixture = new Pool(connection(fixtureDatabase));

    // Build a complete unledgered schema from the exact baseline used by the
    // real migration scripts. The baseline itself must stay portable rather
    // than relying on a test-only rewrite of version-specific dump settings.
    const baseline = readBaselineSql(migrationsDirectory);
    await fixture.query(baseline);
    await fixture.query('TRUNCATE schema_migrations');
  });

  afterAll(async () => {
    if (fixture) await fixture.end();
    if (maintenance) {
      await maintenance.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname=$1 AND pid<>pg_backend_pid()`,
        [fixtureDatabase],
      );
      await maintenance.query(
        `DROP DATABASE IF EXISTS ${quotedDatabase(fixtureDatabase)}`,
      );
      await maintenance.end();
    }
  });

  it('keeps fresh and upgraded Basic/Pro Linktree allowances consistent', async () => {
    const readLimits = async () =>
      (
        await fixture.query<{ code: string; value: number }>(
          `SELECT p.code, e.value FROM billing_plan_entitlements e
       JOIN billing_entitlements entitlement ON entitlement.id=e.entitlement_id
       JOIN billing_plan_configurations c ON c.id=e.plan_configuration_id
       JOIN billing_plans p ON p.id=c.plan_id
       WHERE entitlement.entitlement_key='limit.linktrees' ORDER BY p.code`,
        )
      ).rows;
    const expected = await readLimits();
    expect(expected).toEqual(
      expect.arrayContaining([
        { code: 'basic', value: 20 },
        { code: 'pro', value: 100 },
        { code: 'ultra', value: -1 },
        { code: 'max', value: -1 },
      ]),
    );
    await fixture.query(`UPDATE billing_plan_entitlements e SET value=to_jsonb(CASE p.code WHEN 'basic' THEN 5 ELSE 20 END)
      FROM billing_plan_configurations c JOIN billing_plans p ON p.id=c.plan_id
      WHERE e.plan_configuration_id=c.id AND p.code IN ('basic','pro')
        AND e.entitlement_id=(SELECT id FROM billing_entitlements WHERE entitlement_key='limit.linktrees')`);
    const sql = readFileSync(
      join(migrationsDirectory, '2026-10-11_basic_pro_linktree_limits.sql'),
      'utf8',
    );
    await fixture.query(sql);
    await fixture.query(sql);
    expect(await readLimits()).toEqual(expected);
  });

  it('seeds Max with a separate profile, inherited permissions and higher limits', async () => {
    const catalog = await fixture.query<{
      code: string;
      monthly_price_minor: string;
      yearly_price_minor: string;
      pixels: number;
    }>(`SELECT p.code, s.monthly_price_minor, s.yearly_price_minor,
      (SELECT value FROM billing_plan_entitlements e JOIN billing_entitlements c ON c.id=e.entitlement_id
        WHERE e.plan_configuration_id=configuration.id AND c.entitlement_key='limit.tiktok_pixels') AS pixels
      FROM billing_subscription_plans s JOIN billing_plans p ON p.id=s.permission_profile_id
      JOIN billing_plan_configurations configuration ON configuration.plan_id=p.id WHERE s.code='max'`);
    expect(catalog.rows).toHaveLength(1);
    expect(catalog.rows[0]).toMatchObject({ code: 'max', pixels: 10 });
    expect(Number(catalog.rows[0].monthly_price_minor)).toBe(6000);
    expect(Number(catalog.rows[0].yearly_price_minor)).toBe(60000);
  });

  it('preserves customized Max policies and prices when the forward migration is repeated', async () => {
    const migration = readFileSync(
      join(migrationsDirectory, '2026-10-09_subscription_catalog.sql'),
      'utf8',
    );
    await fixture.query(
      `UPDATE billing_subscription_plans SET monthly_price_minor=9900 WHERE code='max'`,
    );
    await fixture.query(`UPDATE billing_plan_entitlements SET value='50'::jsonb WHERE plan_configuration_id IN
      (SELECT c.id FROM billing_plan_configurations c JOIN billing_plans p ON p.id=c.plan_id WHERE p.code='max')
      AND entitlement_id=(SELECT id FROM billing_entitlements WHERE entitlement_key='limit.tiktok_pixels')`);
    try {
      await fixture.query(migration);
      await fixture.query(migration);
      const price = await fixture.query<{ price: string }>(
        `SELECT monthly_price_minor AS price FROM billing_subscription_plans WHERE code='max'`,
      );
      expect(Number(price.rows[0].price)).toBe(9900);
      await fixture.query(
        `DELETE FROM billing_subscription_plans WHERE code='max'`,
      );
      await fixture.query(migration);
      const restored = await fixture.query<{
        count: number;
        pixels: number;
      }>(`SELECT
        (SELECT COUNT(*)::int FROM billing_subscription_plans WHERE code='max') AS count,
        (SELECT e.value FROM billing_plan_entitlements e JOIN billing_entitlements catalog ON catalog.id=e.entitlement_id
          JOIN billing_plan_configurations c ON c.id=e.plan_configuration_id JOIN billing_plans p ON p.id=c.plan_id
          WHERE p.code='max' AND catalog.entitlement_key='limit.tiktok_pixels') AS pixels`);
      expect(restored.rows[0]).toEqual({ count: 1, pixels: 50 });
    } finally {
      await fixture.query(
        `UPDATE billing_subscription_plans SET monthly_price_minor=6000 WHERE code='max'`,
      );
      await fixture.query(`UPDATE billing_plan_entitlements SET value='10'::jsonb WHERE plan_configuration_id IN
        (SELECT c.id FROM billing_plan_configurations c JOIN billing_plans p ON p.id=c.plan_id WHERE p.code='max')
        AND entitlement_id=(SELECT id FROM billing_entitlements WHERE entitlement_key='limit.tiktok_pixels')`);
    }
  });

  it('records a complete unledgered schema without replaying it', async () => {
    const admin = await fixture.query<{ id: string }>(
      `INSERT INTO platform_admins (username, name)
       VALUES ('migration-fixture-admin', 'Migration fixture') RETURNING id`,
    );
    const user = await fixture.query<{ id: string }>(
      `INSERT INTO users (email, display_name)
       VALUES ('orphan@example.com', 'Orphan owner') RETURNING id`,
    );
    const invitation = await fixture.query<{ id: string }>(
      `INSERT INTO business_signup_invitations (token_hash, expires_at, created_by)
       VALUES ($1, NOW() + INTERVAL '1 day', $2) RETURNING id`,
      ['a'.repeat(64), admin.rows[0].id],
    );
    const application = await fixture.query<{ id: string }>(
      `INSERT INTO business_signup_applications
         (invitation_id, user_id, status, owner_name, owner_email,
           business_name, phone, requested_subdomain, logo)
       VALUES ($1, $2, 'approved', 'Orphan owner', 'orphan@example.com',
                'Old Business', '7501234567', 'released-tenant', '/images/upload/old-logo.png')
       RETURNING id`,
      [invitation.rows[0].id, user.rows[0].id],
    );
    const runner = join(__dirname, '../node_modules/ts-node/dist/bin.js');
    const result = spawnSync(
      process.execPath,
      [runner, 'scripts/db-migrate.ts'],
      {
        cwd: join(__dirname, '..'),
        env: {
          ...process.env,
          DB_NAME: fixtureDatabase,
          DB_MAINTENANCE_NAME: process.env.DB_MAINTENANCE_NAME || 'postgres',
          PLATFORM_ADMIN_USERNAME: '',
        },
        encoding: 'utf8',
        timeout: 90_000,
      },
    );

    if (result.status !== 0) {
      throw new Error(
        `Migration runner failed:\n${result.stdout || ''}\n${result.stderr || ''}`,
      );
    }
    const ledger = await fixture.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY filename',
    );
    const forwardMigrations = readdirSync(migrationsDirectory)
      .filter((name) => /^\d{4}-\d{2}-\d{2}_.+\.sql$/.test(name))
      .sort();
    expect(ledger.rows.map((row) => row.filename)).toEqual([
      ...forwardMigrations,
      BASELINE_LEDGER_NAME,
    ]);
    const repaired = await fixture.query<{
      status: string;
      business_name: string | null;
      phone: string | null;
      requested_subdomain: string | null;
      logo: string | null;
    }>(
      `SELECT status, business_name, phone, requested_subdomain, logo
       FROM business_signup_applications WHERE id = $1`,
      [application.rows[0].id],
    );
    expect(repaired.rows[0]).toEqual({
      status: 'deleted',
      business_name: null,
      phone: null,
      requested_subdomain: null,
      logo: null,
    });
    const retainedBusinessTable = await fixture.query<{ exists: boolean }>(
      `SELECT to_regclass('public.businesses') IS NOT NULL AS exists`,
    );
    expect(retainedBusinessTable.rows[0].exists).toBe(true);
    const currentLinktreeSchema = await fixture.query<{
      column_exists: boolean;
      index_exists: boolean;
    }>(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'linktrees'
             AND column_name = 'is_archived'
        ) AS column_exists,
        to_regclass(
          'public.idx_linktrees_business_archived'
        ) IS NOT NULL AS index_exists
    `);
    expect(currentLinktreeSchema.rows[0]).toEqual({
      column_exists: true,
      index_exists: true,
    });
  });

  it('refuses a reset by default while the backend is connected', async () => {
    const backendConnection = new Pool({
      ...connection(fixtureDatabase),
      application_name: 'sponsor-krd-backend',
    });
    await backendConnection.query('SELECT 1');

    try {
      const runner = join(__dirname, '../node_modules/ts-node/dist/bin.js');
      const result = spawnSync(
        process.execPath,
        [runner, 'scripts/db-reset.ts'],
        {
          cwd: join(__dirname, '..'),
          env: {
            ...process.env,
            DB_NAME: fixtureDatabase,
            DB_MAINTENANCE_NAME: process.env.DB_MAINTENANCE_NAME || 'postgres',
            DB_RESET_REQUIRE_STOPPED_BACKEND: '',
            PLATFORM_ADMIN_USERNAME: '',
          },
          encoding: 'utf8',
          timeout: 90_000,
        },
      );

      expect(result.status).toBe(1);
      expect(`${result.stdout}\n${result.stderr}`).toContain(
        'Stop the backend first',
      );
      const retainedSchema = await fixture.query<{ exists: boolean }>(
        `SELECT to_regclass('public.businesses') IS NOT NULL AS exists`,
      );
      expect(retainedSchema.rows[0].exists).toBe(true);
    } finally {
      await backendConnection.end();
    }
  });

  it('drops the entire database and recreates only the consolidated schema', async () => {
    await fixture.query('CREATE TABLE reset_sentinel (id integer PRIMARY KEY)');
    await fixture.query('INSERT INTO reset_sentinel (id) VALUES (1)');
    await fixture.end();

    const runner = join(__dirname, '../node_modules/ts-node/dist/bin.js');
    const result = spawnSync(
      process.execPath,
      [runner, 'scripts/db-reset.ts'],
      {
        cwd: join(__dirname, '..'),
        env: {
          ...process.env,
          DB_NAME: fixtureDatabase,
          DB_MAINTENANCE_NAME: process.env.DB_MAINTENANCE_NAME || 'postgres',
          DB_RESET_REQUIRE_STOPPED_BACKEND: 'false',
          PLATFORM_ADMIN_USERNAME: '',
        },
        encoding: 'utf8',
        timeout: 90_000,
      },
    );

    if (result.status !== 0) {
      throw new Error(
        `Reset runner failed:\n${result.stdout || ''}\n${result.stderr || ''}`,
      );
    }

    fixture = new Pool(connection(fixtureDatabase));
    const state = await fixture.query<{
      sentinel_exists: boolean;
      businesses_exists: boolean;
      obsolete_audit_column_exists: boolean;
    }>(`
      SELECT
        to_regclass('public.reset_sentinel') IS NOT NULL AS sentinel_exists,
        to_regclass('public.businesses') IS NOT NULL AS businesses_exists,
        EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'platform_data_retention_settings'
             AND column_name = 'audit_log_days'
        ) AS obsolete_audit_column_exists
    `);
    expect(state.rows[0]).toEqual({
      sentinel_exists: false,
      businesses_exists: true,
      obsolete_audit_column_exists: false,
    });

    const ledger = await fixture.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY filename',
    );
    expect(ledger.rows.map((row) => row.filename)).toEqual([
      BASELINE_LEDGER_NAME,
    ]);
  });
});
