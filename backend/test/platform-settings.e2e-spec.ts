import { Pool, type PoolClient } from 'pg';
import { join } from 'path';
import { readBaselineSql } from '../src/database/baseline';
import { PlatformSettingsService } from '../src/platform-admin/platform-settings.service';
import { DatabaseService } from '../src/database/database.service';

const name = `sponsor_krd_platform_settings_e2e_${process.pid}`;
const connect = (database: string) => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database,
  connectionTimeoutMillis: 5000,
});

describe('atomic platform General settings (PostgreSQL)', () => {
  jest.setTimeout(60000);
  let maintenance: Pool;
  let pool: Pool;
  let service: PlatformSettingsService;
  let id: string;
  const clear = jest.fn(async () => 1);
  beforeAll(async () => {
    if (!/^sponsor_krd_platform_settings_e2e_\d+$/.test(name))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool(
      connect(process.env.DB_MAINTENANCE_NAME || 'postgres'),
    );
    await maintenance.query(
      `CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8'`,
    );
    pool = new Pool(connect(name));
    await pool.query(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    await pool.query(
      "ALTER TABLE platform_admins ADD CONSTRAINT fixture_brand_check CHECK (name <> 'Rejected brand')",
    );
    id = (
      await pool.query<{ id: string }>(
        "INSERT INTO platform_admins(username,name) VALUES('fixture-operator','Original brand') RETURNING id",
      )
    ).rows[0].id;
    const database = {
      query: pool.query.bind(pool),
      transaction: async <T>(operation: (client: PoolClient) => Promise<T>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await operation(client);
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
    service = new PlatformSettingsService(database, {
      deleteByPattern: clear,
    } as never);
  });
  afterAll(async () => {
    await pool?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await maintenance.end();
    }
  });
  it('rolls back the profile when the branding write fails', async () => {
    await expect(
      service.updateGeneral(id, {
        profile: { username: 'must-not-persist' },
        branding: { name: 'Rejected brand' },
      }),
    ).rejects.toThrow();
    expect(
      (
        await pool.query(
          'SELECT username,name FROM platform_admins WHERE id=$1',
          [id],
        )
      ).rows[0],
    ).toEqual({ username: 'fixture-operator', name: 'Original brand' });
    expect(clear).not.toHaveBeenCalled();
  });
  it('commits profile and branding together and then invalidates caches', async () => {
    await service.updateGeneral(id, {
      profile: { username: 'new-operator' },
      branding: { name: 'New brand' },
    });
    expect(
      (
        await pool.query(
          'SELECT username,name FROM platform_admins WHERE id=$1',
          [id],
        )
      ).rows[0],
    ).toEqual({ username: 'new-operator', name: 'New brand' });
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
