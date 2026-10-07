import { ConfigService } from '@nestjs/config';
import { DomainDnsService } from './domain-dns.service';
import { configValidationSchema } from '../config/config.schema';
const txt = jest.fn();
const ipv4 = jest.fn();
const ipv6 = jest.fn();
const setServers = jest.fn();
jest.mock('node:dns/promises', () => ({
  Resolver: jest.fn().mockImplementation(() => ({
    resolveTxt: txt,
    resolve4: ipv4,
    resolve6: ipv6,
    setServers,
  })),
}));
describe('domain DNS verification', () => {
  it.each(['', 'https://1.1.1.1', 'dns.example.com', '1.1.1.1,', '1.1.1.1:53', '1.1.1.1,8.8.8.8,9.9.9.9,8.8.4.4,1.0.0.1'])(
    'rejects invalid DNS-server configuration: %s',
    (value) => {
      expect(configValidationSchema.extract('CUSTOM_DOMAIN_DNS_SERVERS').validate(value).error).toBeDefined();
    },
  );
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
    expect(setServers).toHaveBeenCalledWith(['1.1.1.1', '8.8.8.8']);
  });
  it('uses configured resolvers for both ownership and address queries', async () => {
    const configured = new DomainDnsService(
      new ConfigService({
        CUSTOM_DOMAIN_DNS_SERVERS: ' 9.9.9.9 , 2620:fe::fe ',
        CUSTOM_DOMAIN_IPV4: '203.0.113.10',
      }),
    );
    expect(await configured.check('wafaye.com', 'token')).toBeNull();
    expect(setServers).toHaveBeenCalledWith(['9.9.9.9', '2620:fe::fe']);
  });
  it('logs missing versus mismatched proofs without logging token values', async () => {
    const { Logger } = await import('@nestjs/common');
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    try {
      txt.mockResolvedValue([]);
      expect(await service.check('wafaye.com', 'secret-proof')).toBe(
        'ownership',
      );
      expect(warn).toHaveBeenLastCalledWith(
        expect.stringContaining('no TXT record returned'),
      );
      txt.mockResolvedValue([['sponsor-verification=wrong-proof']]);
      expect(await service.check('wafaye.com', 'secret-proof')).toBe(
        'ownership',
      );
      expect(warn).toHaveBeenLastCalledWith(
        expect.stringContaining('does not match the current domain claim'),
      );
      expect(JSON.stringify(warn.mock.calls)).not.toMatch(
        /secret-proof|wrong-proof/,
      );
    } finally {
      warn.mockRestore();
    }
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
