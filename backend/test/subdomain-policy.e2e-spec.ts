import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { readBaselineSql } from '../src/database/baseline';
import { SubdomainPolicyService } from '../src/subdomains/subdomain-policy.service';

const databaseName = `sponsor_krd_subdomain_test_${process.pid}`;
const migrations = join(__dirname, '../src/database/migrations');
const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

describe('durable subdomain policy', () => {
  jest.setTimeout(60_000);
  let maintenance: Pool;
  let database: Pool;
  let adminId: string;

  beforeAll(async () => {
    if (!/^sponsor_krd_subdomain_test_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool({
      ...connection,
      database: process.env.DB_MAINTENANCE_NAME || 'postgres',
    });
    await maintenance.query(`CREATE DATABASE "${databaseName}"`);
    database = new Pool({ ...connection, database: databaseName });
    await database.query(readBaselineSql(migrations));
    // The same additive migration can run on a fresh baseline and be rerun.
    const sql = readFileSync(
      join(migrations, '2026-10-07_blocked_subdomains.sql'),
      'utf8',
    );
    await database.query(sql);
    await database.query(sql);
    const admin = await database.query<{ id: string }>(
      "INSERT INTO platform_admins (username, name) VALUES ('subdomain-test-admin', 'Test admin') RETURNING id",
    );
    adminId = admin.rows[0].id;
  });

  afterAll(async () => {
    await database?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });

  async function application(subdomain: string) {
    const user = await database.query<{ id: string }>(
      'INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING id',
      [`${randomUUID()}@example.com`, 'Test owner'],
    );
    const invitation = await database.query<{ id: string }>(
      "INSERT INTO business_signup_invitations (token_hash, expires_at, created_by) VALUES ($1, now() + interval '1 day', $2) RETURNING id",
      [randomUUID().replace(/-/g, '').padEnd(64, '0'), adminId],
    );
    return database.query<{ id: string }>(
      `INSERT INTO business_signup_applications (invitation_id, user_id, owner_name, owner_email, requested_subdomain)
      VALUES ($1, $2, 'Test owner', 'owner@example.com', $3) RETURNING id`,
      [invitation.rows[0].id, user.rows[0].id, subdomain],
    );
  }

  it('rejects blocked signup and business assignments, including direct writes', async () => {
    await database.query(
      "INSERT INTO platform_blocked_subdomains (subdomain) VALUES ('blocked-test')",
    );
    await expect(application('blocked-test')).rejects.toMatchObject({
      constraint: 'subdomain_not_blocked',
    });
    await expect(
      database.query(
        "INSERT INTO businesses (username, name, subdomain) VALUES ('blocked-test', 'Test', 'blocked-test')",
      ),
    ).rejects.toMatchObject({ constraint: 'subdomain_not_blocked' });
  });

  it('does not let a block displace a live business or reserved draft', async () => {
    await database.query(
      "INSERT INTO businesses (username, name, subdomain) VALUES ('assigned-test', 'Test', 'assigned-test')",
    );
    await expect(
      database.query(
        "INSERT INTO platform_blocked_subdomains (subdomain) VALUES ('assigned-test')",
      ),
    ).rejects.toMatchObject({ constraint: 'blocked_subdomain_unassigned' });
    await application('draft-test');
    await expect(
      database.query(
        "INSERT INTO platform_blocked_subdomains (subdomain) VALUES ('draft-test')",
      ),
    ).rejects.toMatchObject({ constraint: 'blocked_subdomain_unassigned' });
  });

  it('allows a removed custom block to be used', async () => {
    await database.query(
      "INSERT INTO platform_blocked_subdomains (subdomain) VALUES ('released-test')",
    );
    await database.query(
      "DELETE FROM platform_blocked_subdomains WHERE subdomain = 'released-test'",
    );
    await expect(application('released-test')).resolves.toMatchObject({
      rowCount: 1,
    });
  });

  it('rejects an application for a business name even if an earlier availability check succeeded', async () => {
    await database.query(
      "INSERT INTO businesses (username, name, subdomain) VALUES ('race-test', 'Test', 'race-test')",
    );
    await expect(application('race-test')).rejects.toMatchObject({
      constraint: 'signup_subdomain_available',
    });
  });

  it('serializes a block racing with business creation', async () => {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        "INSERT INTO platform_blocked_subdomains (subdomain) VALUES ('concurrent-test')",
      );
      const attempted = database.query(
        "INSERT INTO businesses (username, name, subdomain) VALUES ('concurrent-test', 'Test', 'concurrent-test')",
      );
      const rejected = expect(attempted).rejects.toMatchObject({
        constraint: 'subdomain_not_blocked',
      });
      await client.query('COMMIT');
      await rejected;
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('records policy changes with the administrator and does not expose an available blocked name', async () => {
    const service = new SubdomainPolicyService(database as never);
    await service.add('audited-test', adminId);
    await expect(service.availability('audited-test')).resolves.toMatchObject({
      available: false,
      reason: 'blocked',
    });
    await service.remove('audited-test', adminId);
    const events =
      await database.query(`SELECT event_type, actor_id FROM billing_policy_audit_events
      WHERE resource_type = 'platform.subdomains' AND COALESCE(after_value, before_value)->>'subdomain' = 'audited-test'`);
    expect(events.rows).toEqual(
      expect.arrayContaining([
        { event_type: 'subdomain.blocked', actor_id: adminId },
        { event_type: 'subdomain.unblocked', actor_id: adminId },
      ]),
    );
  });

  it('allows approval to assign the reserved name to its own business', async () => {
    const result = await application('approval-test');
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const business = await client.query<{ id: string }>(
        "INSERT INTO businesses (username, name, subdomain) VALUES ('approval-test', 'Test', 'approval-test') RETURNING id",
      );
      await client.query(
        "UPDATE business_signup_applications SET status = 'approved', business_id = $1 WHERE id = $2",
        [business.rows[0].id, result.rows[0].id],
      );
      await client.query('COMMIT');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
