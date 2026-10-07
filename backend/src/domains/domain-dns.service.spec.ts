import { ConfigService } from '@nestjs/config';
import { DomainDnsService } from './domain-dns.service';
const txt = jest.fn();
const ipv4 = jest.fn();
const ipv6 = jest.fn();
jest.mock('node:dns/promises', () => ({
  Resolver: jest.fn().mockImplementation(() => ({
    resolveTxt: txt,
    resolve4: ipv4,
    resolve6: ipv6,
  })),
}));
describe('domain DNS verification', () => {
  const service = new DomainDnsService(
    new ConfigService({
      CUSTOM_DOMAIN_IPV4: '203.0.113.10',
      CUSTOM_DOMAIN_IPV6: '',
    }),
  );
  beforeEach(() => {
    jest.clearAllMocks();
    txt.mockResolvedValue([['sponsor-verification=', 'token']]);
    ipv4.mockResolvedValue(['203.0.113.10']);
    ipv6.mockResolvedValue([]);
  });
  it('accepts a matching ownership proof and exact origin routing', async () => {
    expect(await service.check('wafaye.com', 'token')).toBeNull();
  });
  it('rejects routing without the exact owner token', async () => {
    txt.mockResolvedValue([['sponsor-verification=other']]);
    expect(await service.check('wafaye.com', 'token')).toBe('ownership');
    expect(ipv4).not.toHaveBeenCalled();
  });
  it('rejects stale IPv6 or mixed IPv4 records', async () => {
    ipv6.mockResolvedValue(['2001:db8::1']);
    expect(await service.check('wafaye.com', 'token')).toBe('routing');
    ipv6.mockResolvedValue([]);
    ipv4.mockResolvedValue(['203.0.113.10', '203.0.113.11']);
    expect(await service.check('wafaye.com', 'token')).toBe('routing');
  });
  it('treats missing ownership records as a failed proof', async () => {
    txt.mockRejectedValue({ code: 'ENOTFOUND' });
    expect(await service.check('wafaye.com', 'token')).toBe('ownership');
  });
  it('keeps transient DNS failures distinct from revoked ownership', async () => {
    txt.mockRejectedValue({ code: 'ETIMEOUT' });
    await expect(service.check('wafaye.com', 'token')).rejects.toThrow(
      'temporarily unavailable',
    );
  });
});
