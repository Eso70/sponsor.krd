import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessGuard } from './business.guard';
import { SessionService } from './session.service';

describe('business hostname boundary', () => {
  const guard = new BusinessGuard(
    {
      getSessionUser: async () => ({
        id: 'business',
        role: 'business',
        subdomain: 'wafaye',
      }),
    } as unknown as SessionService,
    new ConfigService({ ROOT_DOMAIN: 'sponsor.krd' }),
  );
  function context(host: string, forwardedHost?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: { business_session: 'session' },
          headers: {
            host,
            'x-forwarded-host': forwardedHost,
            'x-subdomain': 'wafaye',
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }
  it.each([
    'wafaye.com',
    'sponsor.krd',
    'other.sponsor.krd',
    'wafaye.nested.sponsor.krd',
  ])(
    'rejects %s even with a forged forwarded tenant hostname',
    async (host) => {
      await expect(
        guard.canActivate(context(host, 'wafaye.sponsor.krd')),
      ).rejects.toThrow('Invalid business session');
    },
  );
  it('uses the preserved tenant Host instead of an untrusted forwarding header', async () => {
    await expect(
      guard.canActivate(context('wafaye.sponsor.krd', 'other.sponsor.krd')),
    ).resolves.toBe(true);
  });
  it('accepts the server-resolved custom tenant and rejects a different tenant session', async () => {
    const request = {
      cookies: { business_session: 'session' },
      headers: { host: 'wafaye.com', 'x-subdomain': 'other' },
      customDomainSubdomain: 'wafaye',
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    request.customDomainSubdomain = 'other';
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Invalid business session',
    );
  });
});
