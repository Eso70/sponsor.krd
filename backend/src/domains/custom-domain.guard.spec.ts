import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { CustomDomainGuard, type DomainRequest } from './custom-domain.guard';
import { DomainsService } from './domains.service';
describe('custom domain API boundary', () => {
  const resolve = jest.fn();
  const guard = new CustomDomainGuard(
    { resolve } as unknown as DomainsService,
    new ConfigService({ ROOT_DOMAIN: 'sponsor.krd' }),
  );
  const context = (request: Partial<DomainRequest>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as ExecutionContext;
  beforeEach(() =>
    resolve.mockResolvedValue({ subdomain: 'wafaye', isCustom: true }),
  );
  function request(path: string) {
    return {
      headers: { host: 'wafaye.com', 'x-subdomain': 'victim' },
      url: path,
      raw: { socket: { remoteAddress: '203.0.113.1' } },
    } as unknown as DomainRequest;
  }
  it('uses the database tenant instead of a forged client header', async () => {
    const req = request('/api/public/business');
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.customDomainSubdomain).toBe('wafaye');
  });
  it.each([
    '/api/auth/profile',
    '/api/platform/businesses',
    '/api/business/domains',
    '/api/analytics/v2/dashboard',
  ])('rejects private route %s', async (path) => {
    await expect(guard.canActivate(context(request(path)))).rejects.toThrow();
  });
  it('rejects unknown domains', async () => {
    resolve.mockResolvedValue(null);
    await expect(
      guard.canActivate(context(request('/api/public/business'))),
    ).rejects.toThrow();
  });
});
