import Fastify from 'fastify';
import { preventPrivateApiCaching } from './private-api-cache';

describe('private API cache boundary', () => {
  it('overrides caching for private responses, encoded routes and errors', async () => {
    const app = Fastify();
    app.addHook('onSend', preventPrivateApiCaching);
    for (const path of [
      '/api/auth/profile',
      '/api/business/settings',
      '/api/public/business',
    ]) {
      app.get(path, async (_request, reply) => {
        reply.header('Cache-Control', 'public, max-age=60');
        return { success: true };
      });
    }
    app.get('/api/auth/failure', async (_request, reply) =>
      reply.code(401).send({ message: 'Unauthorized' }),
    );
    try {
      for (const url of [
        '/api/auth/profile',
        '/api/business/settings',
        '/api/%61uth/profile',
        '/api/auth/failure',
        '/api/auth/missing',
      ]) {
        const response = await app.inject({ url });
        expect(response.headers['cache-control']).toBe('no-store, private');
      }
      const publicResponse = await app.inject({ url: '/api/public/business' });
      expect(publicResponse.headers['cache-control']).toBe(
        'public, max-age=60',
      );
    } finally {
      await app.close();
    }
  });
});
