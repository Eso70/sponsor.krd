import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { DomainDnsService } from './domain-dns.service';
import { DomainTlsService } from './domain-tls.service';
import { DomainsService } from './domains.service';

describe('automatic domain maintenance', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: `domain-${i}`,
    business_id: `business-${i}`,
  }));
  function setup(enabled = true) {
    const query = jest.fn().mockResolvedValue({ rows });
    const service = new DomainsService(
      { query } as unknown as DatabaseService,
      new ConfigService({ CUSTOM_DOMAINS_ENABLED: enabled }),
      {} as DomainDnsService,
      {} as RedisService,
      {} as DomainTlsService,
    );
    const verify = jest.spyOn(service, 'verify');
    return { service, query, verify };
  }
  it('bounds concurrency, skips overlapping runs and continues after individual failures', async () => {
    const { service, query, verify } = setup();
    let active = 0;
    let peak = 0;
    verify.mockImplementation(async (_businessId, id) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      if (id === 'domain-0') throw new Error('Temporary DNS failure');
      return {
        enabled: true,
        target: 'domains.sponsor.krd',
        ipv4: [],
        ipv6: [],
        subdomain: 'business',
        domains: [],
      };
    });
    await Promise.all([service.recheck(), service.recheck()]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledTimes(12);
    expect(peak).toBe(5);
    await service.recheck();
    expect(query).toHaveBeenCalledTimes(2);
  });
  it('can retry maintenance after a database failure', async () => {
    const { service, query, verify } = setup();
    query.mockRejectedValueOnce(new Error('Database unavailable'));
    query.mockResolvedValue({ rows: [] });
    await expect(service.recheck()).rejects.toThrow('Database unavailable');
    await expect(service.recheck()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(2);
    expect(verify).not.toHaveBeenCalled();
  });
  it('does not query or verify when disabled', async () => {
    const { service, query, verify } = setup(false);
    await service.recheck();
    expect(query).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });
});
