import Fastify from 'fastify';
import {
  restoreTrustedProxyHost,
  INTERNAL_PROXY_HOST_HEADER,
  INTERNAL_PROXY_KEY_HEADER,
} from './internal-proxy-trust';
import { isSameOriginBrowserRequest } from './request-origin';

describe('fetch proxy host and origin boundary', () => {
  it('preserves the browser origin through real fetch without admitting cross-origin or unsigned metadata', async () => {
    const originalSecret = process.env.INTERNAL_PROXY_SECRET;
    process.env.INTERNAL_PROXY_SECRET = 'disposable-proxy-host-test-secret';
    const server = Fastify();
    server.addHook('onRequest', async (request, reply) => {
      if (!restoreTrustedProxyHost(request)) return reply.code(400).send();
    });
    server.addHook('preValidation', async (request, reply) => {
      if (
        !isSameOriginBrowserRequest(
          request.headers.origin,
          request.headers.referer,
          request.headers.host,
          request.headers['x-forwarded-proto'],
          request.protocol,
        )
      ) {
        return reply.code(403).send();
      }
    });
    server.post('/test', async (_request, reply) => reply.code(204).send());
    try {
      const address = await server.listen({ port: 0, host: '127.0.0.1' });
      for (const publicHost of ['lvh.me:3011', 'zhirsaz.com']) {
        const protocol = publicHost.includes(':') ? 'http' : 'https';
        const headers = {
          host: publicHost,
          origin: `${protocol}://${publicHost}`,
          'x-forwarded-proto': protocol,
          [INTERNAL_PROXY_HOST_HEADER]: publicHost,
          [INTERNAL_PROXY_KEY_HEADER]: process.env.INTERNAL_PROXY_SECRET,
        };
        const accepted = await fetch(`${address}/test`, {
          method: 'POST',
          headers,
        });
        expect(accepted.status).toBe(204);
        const rejected = await fetch(`${address}/test`, {
          method: 'POST',
          headers: {
            ...headers,
            origin: `${protocol}://attacker.example`,
          },
        });
        expect(rejected.status).toBe(403);
        const unsigned = await fetch(`${address}/test`, {
          method: 'POST',
          headers: {
            ...headers,
            [INTERNAL_PROXY_KEY_HEADER]: 'wrong-key',
          },
        });
        expect(unsigned.status).toBe(403);
        const malformed = await fetch(`${address}/test`, {
          method: 'POST',
          headers: {
            ...headers,
            [INTERNAL_PROXY_HOST_HEADER]: 'localhost/path',
          },
        });
        expect(malformed.status).toBe(400);
      }
    } finally {
      await server.close();
      if (originalSecret === undefined)
        delete process.env.INTERNAL_PROXY_SECRET;
      else process.env.INTERNAL_PROXY_SECRET = originalSecret;
    }
  });
});
