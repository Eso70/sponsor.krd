import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';
import { DataRetentionService } from './data-retention.service';
import { StorageService } from '../storage/storage.service';
import { SubdomainPolicyService } from '../subdomains/subdomain-policy.service';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { AuthorizationService } from '../auth/authorization.service';
import { SessionService } from '../auth/session.service';

describe('blocked subdomains HTTP authorization', () => {
  let app: NestFastifyApplication;
  const policy = { list: jest.fn(), add: jest.fn(), remove: jest.fn() };
  const sessions = { getSessionUser: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PlatformSettingsController],
      providers: [
        PlatformAdminGuard,
        AuthorizationGuard,
        { provide: PlatformSettingsService, useValue: {} },
        { provide: DataRetentionService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: SubdomainPolicyService, useValue: policy },
        { provide: SessionService, useValue: sessions },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(cookie);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    policy.list.mockResolvedValue({ system: ['www'], custom: [] });
    policy.add.mockResolvedValue({ system: ['www'], custom: ['support'] });
  });

  it('rejects anonymous and business users on policy endpoints', async () => {
    const anonymous = await app.inject({
      method: 'GET',
      url: '/api/platform/settings/blocked-subdomains',
    });
    expect(anonymous.statusCode).toBe(401);
    sessions.getSessionUser.mockResolvedValue({
      id: 'business-id',
      role: 'business',
    });
    const business = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/blocked-subdomains',
      headers: { cookie: 'platform_admin_session=business-token' },
      payload: { subdomain: 'support' },
    });
    expect(business.statusCode).toBe(401);
    expect(policy.add).not.toHaveBeenCalled();
  });

  it('passes the authenticated administrator to the mutation and validates payloads', async () => {
    sessions.getSessionUser.mockResolvedValue({
      id: 'admin-id',
      role: 'platform-admin',
    });
    const headers = { cookie: 'platform_admin_session=admin-token' };
    const valid = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/blocked-subdomains',
      headers,
      payload: { subdomain: 'support' },
    });
    expect(valid.statusCode).toBe(201);
    expect(policy.add).toHaveBeenCalledWith('support', 'admin-id');
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/blocked-subdomains',
      headers,
      payload: { subdomain: ['support'], businessId: 'untrusted' },
    });
    expect(invalid.statusCode).toBe(400);
    expect(policy.add).toHaveBeenCalledTimes(1);
  });
});
