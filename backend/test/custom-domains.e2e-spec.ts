import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, type PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import { readBaselineSql } from '../src/database/baseline';
import { DatabaseService } from '../src/database/database.service';
import { DomainsService } from '../src/domains/domains.service';
import { DomainDnsService } from '../src/domains/domain-dns.service';
import { DomainTlsService } from '../src/domains/domain-tls.service';
import { RedisService } from '../src/redis/redis.service';

const databaseName = `sponsor_krd_domains_test_${process.pid}`;
const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};
describe('durable custom domain tenancy', () => {
  jest.setTimeout(60000);
  let maintenance: Pool;
  let db: Pool;
  let service: DomainsService;
  let adapter: DatabaseService;
  let owner: string;
  let other: string;
  const dns = {
    check: jest.fn(),
    addresses: (key: string) =>
      key === 'CUSTOM_DOMAIN_IPV4' ? ['203.0.113.10'] : [],
  };
  const tls = { assertReady: jest.fn() };
  const migrations = join(__dirname, '../src/database/migrations');
  const singleDomainMigration = readFileSync(
    join(migrations, '2026-10-07_single_custom_domain_per_business.sql'),
    'utf8',
  );
  function worker() {
    return new DomainsService(
      adapter,
      new ConfigService({
        ROOT_DOMAIN: 'sponsor.krd',
        CUSTOM_DOMAINS_ENABLED: true,
      }),
      dns as unknown as DomainDnsService,
      { isRateLimited: async () => false } as unknown as RedisService,
      tls as unknown as DomainTlsService,
    );
  }
  beforeAll(async () => {
    if (!/^sponsor_krd_domains_test_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool({
      ...connection,
      database: process.env.DB_MAINTENANCE_NAME || 'postgres',
    });
    await maintenance.query(`CREATE DATABASE "${databaseName}"`);
    db = new Pool({ ...connection, database: databaseName });
    await db.query(readBaselineSql(migrations));
    for (const filename of [
      '2026-10-07_custom_business_domains.sql',
      '2026-10-07_custom_domain_automation.sql',
      '2026-10-07_single_custom_domain_per_business.sql',
    ]) {
      const sql = readFileSync(join(migrations, filename), 'utf8');
      await db.query(sql);
      await db.query(sql);
    }
    const rows = await db.query<{ id: string }>(
      "INSERT INTO businesses (username,name,subdomain) VALUES ('domain-owner','Wafaye','wafaye'),('domain-other','Other','other') RETURNING id",
    );
    owner = rows.rows[0].id;
    other = rows.rows[1].id;
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
    service = worker();
  });
  afterAll(async () => {
    await db?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });
  beforeEach(async () => {
    await db.query('DELETE FROM business_domains');
    await db.query(
      "UPDATE businesses SET status='active' WHERE id=ANY($1::uuid[])",
      [[owner, other]],
    );
    dns.check.mockReset();
    dns.check.mockResolvedValue(null);
    tls.assertReady.mockReset();
    tls.assertReady.mockResolvedValue(undefined);
  });
  async function verifiedDomain() {
    const domain = (await service.add(owner, 'wafaye.com', owner)).domains[0];
    await service.verify(owner, domain.id, owner);
    return domain;
  }
  it.each(['ownership', null] as const)(
    'discards an older DNS result when a newer check returned %s',
    async (latest) => {
      const domain = await verifiedDomain();
      let finishOld!: (result: 'ownership' | null) => void;
      let started!: () => void;
      const waiting = new Promise<void>((resolve) => {
        started = resolve;
      });
      dns.check
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishOld = resolve;
              started();
            }),
        )
        .mockResolvedValueOnce(latest);
      const old = service.verify(owner, domain.id, owner);
      const rejected = expect(old).rejects.toThrow(
        'changed during verification',
      );
      await waiting;
      await worker().verify(owner, domain.id, owner);
      finishOld(latest === null ? 'ownership' : null);
      await rejected;
      expect((await service.list(owner)).domains[0]).toMatchObject({
        status: latest === null ? 'active' : 'disconnected',
        lastError: latest,
      });
    },
  );
  it('renews an expired lease without silently restoring primary selection', async () => {
    const domain = await verifiedDomain();
    await service.primary(owner, domain.id, owner);
    await service.verify(owner, domain.id, owner);
    expect((await service.list(owner)).domains[0].isPrimary).toBe(true);
    await db.query(
      "UPDATE business_domains SET valid_until=now()-interval '1 second' WHERE id=$1",
      [domain.id],
    );
    await service.verify(owner, domain.id, owner);
    expect((await service.list(owner)).domains[0]).toMatchObject({
      status: 'active',
      isPrimary: false,
    });
    expect(await service.resolve('wafaye.sponsor.krd')).toMatchObject({
      primaryHostname: null,
    });
  });
  it('cannot reactivate a removed claim after DNS work finishes', async () => {
    const domain = await verifiedDomain();
    dns.check.mockImplementationOnce(async () => {
      await service.remove(owner, domain.id, owner);
      return null;
    });
    await expect(service.verify(owner, domain.id, owner)).rejects.toThrow(
      'changed during verification',
    );
    expect(await service.resolve(domain.hostname)).toBeNull();
    expect((await service.list(owner)).domains).toEqual([]);
  });
  it('preserves the current lease on transient DNS errors', async () => {
    const domain = await verifiedDomain();
    await service.primary(owner, domain.id, owner);
    const before = (await service.list(owner)).domains[0];
    dns.check.mockRejectedValueOnce(new Error('DNS unavailable'));
    await expect(service.verify(owner, domain.id, owner)).rejects.toThrow(
      'DNS unavailable',
    );
    expect((await service.list(owner)).domains[0]).toEqual(before);
  });
  it('rejects activation if the business is suspended during the HTTPS check', async () => {
    const domain = await verifiedDomain();
    tls.assertReady.mockImplementationOnce(async () => {
      await db.query("UPDATE businesses SET status='suspended' WHERE id=$1", [
        owner,
      ]);
    });
    await expect(service.primary(owner, domain.id, owner)).rejects.toThrow(
      'Active business not found',
    );
    await expect(service.verify(owner, domain.id, owner)).rejects.toThrow(
      'Domain not found',
    );
    expect((await service.list(owner)).domains[0].isPrimary).toBe(false);
    expect(await service.resolve(domain.hostname)).toBeNull();
  });
  it('requires verification, prevents duplicate assignments, and scopes mutations to the owner', async () => {
    const domain = (await service.add(owner, 'WAFAYE.com', owner)).domains[0];
    expect(domain.verificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(await service.resolve('wafaye.com')).toBeNull();
    await expect(service.add(other, 'wafaye.com', other)).rejects.toThrow(
      'already connected',
    );
    await expect(service.verify(other, domain.id, other)).rejects.toThrow(
      'not found',
    );
    await expect(service.remove(other, domain.id, other)).rejects.toThrow(
      'not found',
    );
    await expect(service.primary(other, domain.id, other)).rejects.toThrow(
      'Verify the domain',
    );
    const verified = await service.verify(owner, domain.id, owner);
    expect(verified.domains[0].status).toBe('active');
    expect(await service.resolve('wafaye.com')).toMatchObject({
      subdomain: 'wafaye',
      isCustom: true,
      primaryHostname: null,
    });
  });
  it('requires valid HTTPS before making a verified domain primary', async () => {
    const domain = await verifiedDomain();
    tls.assertReady.mockRejectedValueOnce(new Error('TLS pending'));
    await expect(service.primary(owner, domain.id, owner)).rejects.toThrow(
      'TLS pending',
    );
    expect((await service.list(owner)).domains[0].isPrimary).toBe(false);
    await service.primary(owner, domain.id, owner);
    expect(await service.resolve('wafaye.sponsor.krd')).toMatchObject({
      primaryHostname: 'wafaye.com',
      isCustom: false,
    });
  });
  it('fails closed on lost ownership and restores the original subdomain', async () => {
    const domain = await verifiedDomain();
    await service.primary(owner, domain.id, owner);
    dns.check.mockResolvedValue('ownership');
    await service.verify(owner, domain.id, owner);
    expect(await service.resolve('wafaye.com')).toBeNull();
    expect(await service.resolve('wafaye.sponsor.krd')).toMatchObject({
      primaryHostname: null,
    });
    expect((await service.list(owner)).domains[0]).toMatchObject({
      status: 'disconnected',
      isPrimary: false,
      lastError: 'ownership',
    });
  });
  it('expires stale verifications and invalidates routing immediately after removal', async () => {
    const domain = await verifiedDomain();
    await db.query(
      "UPDATE business_domains SET valid_until=now()-interval '1 second' WHERE id=$1",
      [domain.id],
    );
    expect(await service.resolve('wafaye.com')).toBeNull();
    await service.verify(owner, domain.id, owner);
    await service.primary(owner, domain.id, owner);
    await service.remove(owner, domain.id, owner);
    expect(await service.resolve('wafaye.com')).toBeNull();
    expect(await service.resolve('wafaye.sponsor.krd')).toMatchObject({
      subdomain: 'wafaye',
      isCustom: false,
      primaryHostname: null,
    });
    expect((await service.list(owner)).domains).toEqual([]);
    const audit = await db.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM billing_policy_audit_events WHERE business_id=$1 AND resource_type='business.domains'",
      [owner],
    );
    expect(audit.rows[0].count).toBeGreaterThan(2);
  });
  it('releases expired claims and allows replacing the business domain after removal', async () => {
    const stale = (await service.add(other, 'expired-domain.com', other))
      .domains[0];
    await db.query(
      "UPDATE business_domains SET created_at=now()-interval '8 days' WHERE id=$1",
      [stale.id],
    );
    await expect(service.verify(other, stale.id, other)).rejects.toThrow(
      'expired',
    );
    const claimed = (await service.add(owner, 'expired-domain.com', owner))
      .domains[0];
    expect(claimed.verificationToken).not.toBe(stale.verificationToken);
    await expect(service.add(owner, 'replacement.com', owner)).rejects.toThrow(
      'one custom domain',
    );
    await service.remove(owner, claimed.id, owner);
    expect(
      (await service.add(owner, 'replacement.com', owner)).domains[0].hostname,
    ).toBe('replacement.com');
  });
  it('automatically verifies one domain for each of many businesses across workers', async () => {
    const businesses: string[] = [];
    for (let i = 0; i < 12; i++) {
      const row = await db.query<{ id: string }>(
        'INSERT INTO businesses (username,name,subdomain) VALUES ($1,$2,$3) RETURNING id',
        [`auto-domain-${i}`, `Automatic ${i}`, `autodomains${i}`],
      );
      const id = row.rows[0].id;
      businesses.push(id);
      await service.add(id, `automatic-${i}.com`, id);
    }
    dns.check.mockImplementation(async (hostname: string) =>
      hostname === 'automatic-0.com' ? 'ownership' : null,
    );
    await Promise.all([service.recheck(), worker().recheck()]);
    expect(dns.check).toHaveBeenCalledTimes(12);
    for (let i = 1; i < 12; i++) {
      expect((await service.list(businesses[i])).domains).toHaveLength(1);
      expect(await service.resolve(`automatic-${i}.com`)).toMatchObject({
        subdomain: `autodomains${i}`,
      });
    }
    const businessId = businesses[0];
    const waiting = (await service.list(businessId)).domains[0];
    expect(await service.resolve(waiting.hostname)).toBeNull();
    await db.query(
      "UPDATE business_domains SET checked_at=now()-interval '6 minutes' WHERE id=$1",
      [waiting.id],
    );
    dns.check.mockResolvedValue(null);
    await service.recheck();
    expect(await service.resolve(waiting.hostname)).toMatchObject({
      subdomain: 'autodomains0',
    });
    dns.check.mockResolvedValue('routing');
    await service.verify(businessId, waiting.id, businessId);
    expect(await service.resolve(waiting.hostname)).toBeNull();
    await db.query(
      "UPDATE business_domains SET checked_at=now()-interval '16 minutes' WHERE id=$1",
      [waiting.id],
    );
    dns.check.mockResolvedValue(null);
    await service.recheck();
    expect(await service.resolve(waiting.hostname)).toMatchObject({
      subdomain: 'autodomains0',
      primaryHostname: null,
    });
  });
  it('skips expired claims and suspended businesses during automatic verification', async () => {
    const stale = (await service.add(owner, 'expired-auto.com', owner))
      .domains[0];
    await db.query(
      "UPDATE business_domains SET created_at=now()-interval '8 days' WHERE id=$1",
      [stale.id],
    );
    const suspended = (await service.add(other, 'suspended-auto.com', other))
      .domains[0];
    await db.query("UPDATE businesses SET status='suspended' WHERE id=$1", [
      other,
    ]);
    await service.recheck();
    expect(dns.check).not.toHaveBeenCalled();
    expect(await service.resolve(suspended.hostname)).toBeNull();
    await db.query("UPDATE businesses SET status='active' WHERE id=$1", [
      other,
    ]);
    await service.recheck();
    expect(dns.check).toHaveBeenCalledTimes(1);
    expect(dns.check).toHaveBeenCalledWith(
      suspended.hostname,
      suspended.verificationToken,
    );
  });
  it('enforces one domain per business for concurrent requests and direct database writes', async () => {
    const attempts = await Promise.allSettled([
      service.add(owner, 'first.com', owner),
      service.add(owner, 'second.com', owner),
    ]);
    expect(
      attempts.filter((attempt) => attempt.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await service.list(owner)).domains).toHaveLength(1);
    await expect(
      db.query(
        'INSERT INTO business_domains (business_id,hostname,verification_token) VALUES ($1,$2,$3)',
        [owner, 'third.com', 'a'.repeat(64)],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    expect((await service.add(other, 'other.com', other)).domains).toHaveLength(
      1,
    );
  });
  it('does not delete legacy duplicate assignments when applying the one-domain migration', async () => {
    await db.query('DROP INDEX business_domains_one_domain');
    await db.query(
      'INSERT INTO business_domains (business_id,hostname,verification_token) VALUES ($1,$2,$4),($1,$3,$4)',
      [owner, 'legacy-one.com', 'legacy-two.com', 'a'.repeat(64)],
    );
    await expect(db.query(singleDomainMigration)).rejects.toThrow(
      'Remove extra domains',
    );
    expect((await service.list(owner)).domains).toHaveLength(2);
    const domains = (await service.list(owner)).domains;
    await service.remove(owner, domains[1].id, owner);
    await db.query(singleDomainMigration);
    await db.query(singleDomainMigration);
    expect((await service.list(owner)).domains).toHaveLength(1);
  });
});
