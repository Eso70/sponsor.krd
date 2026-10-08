import { BusinessOnboardingService } from './business-onboarding.service';
import { ConfigService } from '@nestjs/config';

describe('custom domain sign-in handoff', () => {
  it('returns Google sign-in to the selected custom domain, then consumes once there', async () => {
    let stored: unknown;
    const redis = {
      isAvailable: () => true,
      consume: jest
        .fn()
        .mockResolvedValueOnce({
          mode: 'signin',
          subdomain: 'eso',
          nonce: 'nonce',
          verifier: 'verifier',
        })
        .mockImplementation(async () => {
          const value = stored;
          stored = undefined;
          return value;
        }),
      set: jest.fn(async (_key: string, value: unknown) => {
        stored = value;
        return true;
      }),
    };
    const database = {
      query: jest.fn(async (sql: string) => ({
        rows: sql.includes('FROM user_identities identity')
          ? [
              {
                user_id: 'owner',
                business_id: 'business',
                subdomain: 'eso',
                username: 'eso',
                business_name: 'Zhirsaz',
              },
            ]
          : sql.includes('FROM business_domains d')
            ? [{ hostname: 'zhirsaz.com' }]
            : [],
      })),
    };
    const sessions = {
      createBusinessSession: jest
        .fn()
        .mockResolvedValue({ sessionToken: 'session' }),
    };
    const service = new BusinessOnboardingService(
      database as never,
      redis as never,
      {
        exchangeCode: async () => ({
          subject: 'google-owner',
          emailVerified: true,
        }),
      } as never,
      sessions as never,
      {} as never,
      new ConfigService({
        APP_BASE_URL: 'https://sponsor.krd',
        CUSTOM_DOMAINS_ENABLED: true,
      }),
    );
    const result = await service.finishGoogleCallback('google-code', 'state');
    const url = new URL(result.redirectUrl);
    expect(url.origin).toBe('https://zhirsaz.com');
    expect(url.pathname).toBe('/business/auth/consume');
    expect(stored).toMatchObject({
      business_id: 'business',
      subdomain: 'eso',
      hostname: 'zhirsaz.com',
    });
    const input = {
      code: url.searchParams.get('code')!,
      subdomain: 'eso',
      hostname: 'zhirsaz.com',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    };
    await expect(service.consumeHandoff(input)).resolves.toMatchObject({
      sessionToken: 'session',
    });
    await expect(service.consumeHandoff(input)).rejects.toThrow(
      'Sign-in handoff expired',
    );
    expect(sessions.createBusinessSession).toHaveBeenCalledTimes(1);
  });
  const payload = {
    kind: 'login',
    business_id: 'business',
    user_id: 'owner',
    subdomain: 'eso',
    hostname: 'zhirsaz.com',
  };
  const consume = jest.fn();
  const createBusinessSession = jest.fn();
  const service = new BusinessOnboardingService(
    {} as never,
    { isAvailable: () => true, consume } as never,
    {} as never,
    { createBusinessSession } as never,
    {} as never,
    {} as never,
  );
  beforeEach(() => {
    consume.mockResolvedValue(payload);
    createBusinessSession.mockClear();
  });
  it('creates the tenant session on the exact destination hostname', async () => {
    await service.consumeHandoff({
      code: 'code',
      subdomain: 'eso',
      hostname: 'zhirsaz.com',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });
    expect(createBusinessSession).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'business', userId: 'owner' }),
    );
  });
  it.each(['eso.sponsor.krd', 'other.com', undefined])(
    'rejects replay on %s',
    async (hostname) => {
      await expect(
        service.consumeHandoff({
          code: 'code',
          subdomain: 'eso',
          hostname,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        }),
      ).rejects.toThrow('Sign-in handoff expired');
      expect(createBusinessSession).not.toHaveBeenCalled();
    },
  );
});
