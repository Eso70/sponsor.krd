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
    resolve.mockResolvedValue({
      subdomain: 'wafaye',
      hostname: 'wafaye.com',
      primaryHostname: 'wafaye.com',
      isCustom: true,
    }),
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
    '/api/platform/businesses',
    '/api/signup/email/request',
    '/api/internal/domains/resolve',
    '/api/auth/google/callback',
    '/api/%70latform/businesses',
    '/api/%69nternal/domains/resolve',
  ])('rejects private route %s', async (path) => {
    await expect(guard.canActivate(context(request(path)))).rejects.toThrow();
  });
  it('rejects unknown domains', async () => {
    resolve.mockResolvedValue(null);
    await expect(
      guard.canActivate(context(request('/api/public/business'))),
    ).rejects.toThrow();
  });
  it.each([
    '/api/platform/businesses',
    '/api/signup/email/request',
    '/api/internal/domains/resolve',
    '/api/auth/google/callback',
  ])(
    'also rejects platform-only route %s on the default tenant host',
    async (path) => {
      const req = request(path);
      req.headers.host = 'wafaye.sponsor.krd';
      await expect(guard.canActivate(context(req))).rejects.toThrow();
    },
  );
  it('uses the registered route to block encoded private prefixes', async () => {
    const req = request('/api/%70latform/businesses');
    Object.assign(req, { routeOptions: { url: '/api/platform/businesses' } });
    await expect(guard.canActivate(context(req))).rejects.toThrow();
  });
  it.each([
    '/api/auth/profile',
    '/api/business/settings',
    '/api/analytics/v2/dashboard',
    '/api/auth/email/verify',
    '/api/auth/handoff',
  ])('resolves business API %s from the live custom host', async (path) => {
    const req = request(path);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.customDomainSubdomain).toBe('wafaye');
  });
  it('rejects a verified domain that is not primary', async () => {
    resolve.mockResolvedValue({
      subdomain: 'wafaye',
      hostname: 'wafaye.com',
      isCustom: true,
      primaryHostname: null,
    });
    await expect(
      guard.canActivate(context(request('/api/auth/profile'))),
    ).rejects.toThrow();
  });
  it('disables the old tenant host until the primary mapping is removed', async () => {
    const req = request('/api/auth/profile');
    req.headers.host = 'wafaye.sponsor.krd';
    await expect(guard.canActivate(context(req))).rejects.toThrow();
    resolve.mockResolvedValue({
      subdomain: 'wafaye',
      isCustom: false,
      primaryHostname: null,
    });
    expect(await guard.canActivate(context(req))).toBe(true);
  });
});
