import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import { CustomDomainGuard } from './custom-domain.guard';
import { DomainsService } from './domains.service';
import { AuthController } from '../auth/auth.controller';
import { GoogleBusinessAuthController } from '../onboarding/business-onboarding.controller';
import { BusinessOnboardingService } from '../onboarding/business-onboarding.service';
import { BusinessGuard } from '../auth/business.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { ImpersonationService } from '../auth/impersonation.service';

describe('business authentication on a selected customer hostname over HTTP', () => {
  let app: NestFastifyApplication;
  let active = true;
  const onboarding = {
    assertRateLimit: jest.fn(),
    verifyBusinessEmailCode: jest
      .fn()
      .mockResolvedValue({ sessionToken: 'owner', ttlSeconds: 3600 }),
    consumeHandoff: jest
      .fn()
      .mockResolvedValue({ sessionToken: 'owner', ttlSeconds: 3600 }),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController, GoogleBusinessAuthController],
      providers: [
        BusinessGuard,
        { provide: APP_GUARD, useClass: CustomDomainGuard },
        {
          provide: ConfigService,
          useValue: new ConfigService({ ROOT_DOMAIN: 'sponsor.krd' }),
        },
        {
          provide: DomainsService,
          useValue: {
            resolve: async (host: string) =>
              host === 'zhirsaz.com'
                ? active
                  ? {
                      subdomain: 'eso',
                      hostname: 'zhirsaz.com',
                      primaryHostname: 'zhirsaz.com',
                      isCustom: true,
                    }
                  : null
                : {
                    subdomain: 'eso',
                    hostname: host,
                    primaryHostname: active ? 'zhirsaz.com' : null,
                    isCustom: false,
                  },
          },
        },
        { provide: BusinessOnboardingService, useValue: onboarding },
        {
          provide: AuthService,
          useValue: {
            getBusinessProfile: async () => ({
              id: 'eso-business',
              username: 'eso',
              name: 'Zhirsaz',
            }),
            getBusinessPreferredLocale: async () => 'ckb',
          },
        },
        {
          provide: SessionService,
          useValue: {
            getSessionUser: async (token: string) => ({
              id: token === 'owner' ? 'eso-business' : 'other-business',
              userId: 'owner-user',
              role: 'business',
              subdomain: token === 'owner' ? 'eso' : 'other',
            }),
          },
        },
        { provide: ImpersonationService, useValue: {} },
      ],
    })
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(cookie);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  beforeEach(() => {
    active = true;
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await app?.close();
  });
  it('serves the authenticated tenant, rejects other sessions and ignores forged tenant headers', async () => {
    const owner = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: {
        host: 'zhirsaz.com',
        cookie: 'business_session=owner',
        'x-subdomain': 'other',
      },
    });
    expect(owner.statusCode).toBe(200);
    expect(owner.json()).toMatchObject({
      authenticated: true,
      user: { id: 'eso-business', subdomain: 'eso' },
    });
    const other = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { host: 'zhirsaz.com', cookie: 'business_session=other' },
    });
    expect(other.statusCode).toBe(401);
  });
  it('issues email login cookies directly on the custom host without redirecting', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/email/verify',
      headers: { host: 'zhirsaz.com', 'x-forwarded-proto': 'https' },
      payload: { challengeId: 'challenge', code: '123456' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.headers.location).toBeUndefined();
    expect(response.json()).toMatchObject({
      authenticated: true,
      redirectUrl: '/business',
    });
    const value = String(response.headers['set-cookie']);
    expect(value).toContain('business_session=owner');
    expect(value).toContain('Secure');
    expect(value).toContain('HttpOnly');
    expect(value).not.toMatch(/Domain=/i);
    expect(onboarding.verifyBusinessEmailCode).toHaveBeenCalledWith(
      expect.objectContaining({ subdomain: 'eso' }),
    );
  });
  it('passes the actual custom hostname into the one-use handoff consumer', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/handoff',
      headers: { host: 'zhirsaz.com' },
      payload: { code: 'one-use' },
    });
    expect(response.statusCode).toBe(200);
    expect(onboarding.consumeHandoff).toHaveBeenCalledWith(
      expect.objectContaining({ subdomain: 'eso', hostname: 'zhirsaz.com' }),
    );
  });
  it('disables the old API host and restores it after removal', async () => {
    const request = {
      method: 'GET' as const,
      url: '/api/auth/session',
      headers: { host: 'eso.sponsor.krd', cookie: 'business_session=owner' },
    };
    expect((await app.inject(request)).statusCode).toBe(404);
    active = false;
    expect((await app.inject(request)).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          ...request,
          headers: { ...request.headers, host: 'zhirsaz.com' },
        })
      ).statusCode,
    ).toBe(404);
  });
});
