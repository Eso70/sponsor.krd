import { ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { AnalyticsSharingService } from './analytics-sharing.service';
import {
  BusinessFormAnalyticsSharesController,
  BusinessLinktreeAnalyticsSharesController,
  PlatformFormAnalyticsSharesController,
  PlatformLinktreeAnalyticsSharesController,
  PublicAnalyticsSharesController,
} from './analytics-sharing.controllers';
import { REQUIRED_CAPABILITIES } from '../auth/require-capabilities.decorator';

describe('analytics sharing HTTP boundaries', () => {
  let app: NestFastifyApplication;
  const id = '11111111-1111-4111-8111-111111111111';
  const shares = {
    list: jest.fn(async () => []),
    create: jest.fn(async () => ({ code: '001234' })),
    revealCode: jest.fn(async () => ({ code: '001234' })),
    revoke: jest.fn(async () => ({ id })),
    updateExpiry: jest.fn(async () => ({ expiresAt: null })),
    unlock: jest.fn(async () => ({ token: 'opaque-session', ttl: 900 })),
    report: jest.fn(async () => ({ views: 2 })),
    branding: jest.fn(async () => ({ name: 'Acme', accentColor: '#14b8a6' })),
    responses: jest.fn(async () => ({ items: [], total: 0 })),
  };
  const controllers = [
    BusinessFormAnalyticsSharesController,
    BusinessLinktreeAnalyticsSharesController,
    PlatformFormAnalyticsSharesController,
    PlatformLinktreeAnalyticsSharesController,
  ];
  beforeAll(async () => {
    const guard = {
      canActivate(context: ExecutionContext) {
        context.switchToHttp().getRequest<{ user: { id: string } }>().user = {
          id: 'owner',
        };
        return true;
      },
    };
    const module = await Test.createTestingModule({
      controllers: [...controllers, PublicAnalyticsSharesController],
      providers: [
        { provide: AnalyticsSharingService, useValue: shares },
        {
          provide: PlatformContentWorkspaceService,
          useValue: { getWorkspaceId: async () => 'platform-owner' },
        },
      ],
    })
      .overrideGuard(BusinessGuard)
      .useValue(guard)
      .overrideGuard(PlatformAdminGuard)
      .useValue(guard)
      .overrideGuard(AuthorizationGuard)
      .useValue(guard)
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(cookie);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['/api/forms', 'owner', 'form'],
    ['/api/linktrees', 'owner', 'linktree'],
    ['/api/platform/forms', 'platform-owner', 'form'],
    ['/api/platform/linktrees', 'platform-owner', 'linktree'],
  ])(
    'resolves management ownership and validates expiry at %s',
    async (base, owner, kind) => {
      expect(
        (
          await app.inject({
            method: 'GET',
            url: `${base}/${id}/analytics-shares`,
          })
        ).statusCode,
      ).toBe(200);
      expect(shares.list).toHaveBeenCalledWith(owner, kind, id);
      const body = { locale: 'en' };
      expect(
        (
          await app.inject({
            method: 'POST',
            url: `${base}/${id}/analytics-shares`,
            payload: body,
          })
        ).statusCode,
      ).toBe(201);
      expect(shares.create).toHaveBeenCalledWith(owner, kind, id, body);
      const revealed = await app.inject({
        method: 'POST',
        url: `${base}/${id}/analytics-shares/${id}/code`,
      });
      expect(revealed.statusCode).toBe(201);
      expect(revealed.headers['cache-control']).toContain('no-store');
      expect(shares.revealCode).toHaveBeenCalledWith(owner, kind, id, id);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: `${base}/${id}/analytics-shares/${id}/expiry`,
            payload: { locale: 'en', expiry: 'never' },
          })
        ).statusCode,
      ).toBe(201);
      expect(shares.updateExpiry).toHaveBeenCalledWith(owner, kind, id, id, {
        locale: 'en',
        expiry: 'never',
      });
      for (const payload of [
        { locale: 'en', expiry: 'forever' },
        { locale: 'en', owner: 'other' },
        { locale: 'en', expiry: 'custom', expiresAt: 'invalid' },
        { locale: 'en', includeSubmissions: 'true' },
      ]) {
        expect(
          (
            await app.inject({
              method: 'POST',
              url: `${base}/${id}/analytics-shares`,
              payload,
            })
          ).statusCode,
        ).toBe(400);
      }
      expect(
        (
          await app.inject({
            method: 'POST',
            url: `${base}/${id}/analytics-shares/${id}/disable`,
          })
        ).statusCode,
      ).toBe(201);
      expect(shares.revoke).toHaveBeenCalledWith(owner, kind, id, id, false);
      expect(
        (
          await app.inject({
            method: 'DELETE',
            url: `${base}/${id}/analytics-shares/${id}`,
          })
        ).statusCode,
      ).toBe(200);
      expect(shares.revoke).toHaveBeenCalledWith(owner, kind, id, id, true);
    },
  );

  it('requires page read and update capabilities for every management controller', () => {
    for (const controller of controllers) {
      const capabilities: unknown = Reflect.getMetadata(
        REQUIRED_CAPABILITIES,
        controller,
      );
      if (!Array.isArray(capabilities))
        throw new Error('Missing capability metadata');
      expect(capabilities).toHaveLength(2);
      expect(capabilities[0]).toMatch(/:read$/);
      expect(capabilities[1]).toMatch(/:update$/);
    }
  });

  it('accepts exactly six digits and creates a private, scoped session cookie', async () => {
    for (const code of ['12345', '1234567', 'abcdef', 123456])
      expect(
        (
          await app.inject({
            method: 'POST',
            url: `/api/public/analytics-shares/${id}/unlock`,
            payload: { code },
          })
        ).statusCode,
      ).toBe(400);
    expect(shares.unlock).not.toHaveBeenCalled();
    const response = await app.inject({
      method: 'POST',
      url: `/api/public/analytics-shares/${id}/unlock`,
      payload: { code: '001234' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['x-robots-tag']).toContain('noindex');
    const sessionCookie = String(response.headers['set-cookie']);
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Strict');
    expect(sessionCookie).toContain(`Path=/api/public/analytics-shares/${id}`);
    expect(response.body).not.toContain('opaque-session');
  });

  it('validates response pagination before reading a report', async () => {
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/api/public/analytics-shares/${id}?responsePage=abc`,
        })
      ).statusCode,
    ).toBe(400);
    const response = await app.inject({
      method: 'GET',
      url: `/api/public/analytics-shares/${id}?responsePage=2`,
      cookies: { analytics_share_session: 'session' },
    });
    expect(response.statusCode).toBe(200);
    expect(shares.report).toHaveBeenCalledWith(
      id,
      'session',
      expect.any(String),
      2,
      '',
      { from: undefined, to: undefined },
    );
    expect(response.headers['cache-control']).toContain('no-store');
  });
  it('validates calendar dates and forwards range filters without accepting page scope', async () => {
    for (const query of [
      'from=invalid',
      'from=2026-02-30',
      'to=2026-10-20T00:00:00Z',
      'pageId=other',
    ]) {
      expect(
        (
          await app.inject({
            method: 'GET',
            url: `/api/public/analytics-shares/${id}?${query}`,
          })
        ).statusCode,
      ).toBe(400);
    }
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/api/public/analytics-shares/${id}?from=2026-10-01&to=2026-10-20`,
          cookies: { analytics_share_session: 'session' },
        })
      ).statusCode,
    ).toBe(200);
    expect(shares.report).toHaveBeenLastCalledWith(
      id,
      'session',
      expect.any(String),
      0,
      '',
      { from: '2026-10-01', to: '2026-10-20' },
    );
  });
  it('returns public branding with private cache headers and derives the host scope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/public/analytics-shares/${id}/branding`,
      headers: { host: 'acme.localhost', 'x-subdomain': 'forged' },
    });
    expect(response.statusCode).toBe(200);
    expect(shares.branding).toHaveBeenCalledWith(
      id,
      expect.any(String),
      'acme',
    );
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['x-robots-tag']).toContain('noindex');
  });
  it('validates and forwards shared response filters through the scoped session', async () => {
    for (const query of [
      'page=-1',
      'pageSize=500',
      'from=wrong',
      'to=2026-02-30',
    ]) {
      expect(
        (
          await app.inject({
            method: 'GET',
            url: `/api/public/analytics-shares/${id}/responses?${query}`,
          })
        ).statusCode,
      ).toBe(400);
    }
    expect(shares.responses).not.toHaveBeenCalled();
    const response = await app.inject({
      method: 'GET',
      url: `/api/public/analytics-shares/${id}/responses?page=1&pageSize=50&q=customer&from=2026-10-01&to=2026-10-20`,
      cookies: { analytics_share_session: 'session' },
    });
    expect(response.statusCode).toBe(200);
    expect(shares.responses).toHaveBeenCalledWith(
      id,
      'session',
      expect.any(String),
      1,
      {
        q: 'customer',
        pageSize: 50,
        from: '2026-10-01',
        to: '2026-10-20',
        before: undefined,
      },
      '',
    );
    expect(response.headers['cache-control']).toContain('no-store');
  });
});
