import fastify from 'fastify';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessGuard } from './business.guard';
import type { SessionService } from './session.service';

describe('impersonation restrictions through Fastify routing', () => {
  it('blocks decoded static routes and keeps ordinary owner access', async () => {
    let impersonated = true;
    const sessions = {
      getSessionUser: async () => ({
        id: 'owner',
        role: 'business',
        subdomain: 'tenant',
        ...(impersonated
          ? { impersonation: { platformAdminId: 'admin' } }
          : {}),
      }),
    } as unknown as SessionService;
    const guard = new BusinessGuard(
      sessions,
      new ConfigService({ ROOT_DOMAIN: 'sponsor.krd' }),
    );
    const app = fastify();
    app.get(
      '/api/auth/tiktok/:id/secret',
      {
        preHandler: async (req, reply) => {
          Object.assign(req, { cookies: { business_session: 'test' } });
          try {
            await guard.canActivate({
              switchToHttp: () => ({ getRequest: () => req }),
            } as ExecutionContext);
          } catch {
            await reply.status(403).send({ blocked: true });
          }
        },
      },
      async () => ({ secret: 'fixture' }),
    );
    try {
      for (const path of [
        'tiktok/id/secret',
        '%74iktok/id/secret',
        'tiktok/id/se%63ret',
      ]) {
        const url = `/api/auth/${path}`;
        const headers = { host: 'tenant.sponsor.krd' };
        expect((await app.inject({ url, headers })).statusCode).toBe(403);
        impersonated = false;
        expect((await app.inject({ url, headers })).statusCode).toBe(200);
        impersonated = true;
      }
    } finally {
      await app.close();
    }
  });
});
