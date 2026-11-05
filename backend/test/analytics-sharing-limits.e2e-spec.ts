import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import { AnalyticsSharingService } from '../src/analytics-sharing/analytics-sharing.service';
import { RedisService } from '../src/redis/redis.service';

describe('analytics-share guessing budgets with Redis', () => {
  jest.setTimeout(30_000);
  const secret = 'test-sharing-secret-used-only-by-disposable-fixtures';
  const prefix = `e2e:share-limits:${process.pid}:${randomUUID()}:`;
  let redis: RedisService;
  let service: AnalyticsSharingService;
  let id: string;
  const code = '123456';

  beforeAll(async () => {
    redis = new RedisService(
      new ConfigService({
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
        REDIS_KEY_PREFIX: prefix,
      }),
    );
    redis.onModuleInit();
    await redis.getClient().ping();
    const config = new ConfigService({ APP_ENCRYPTION_KEY: secret });
    const database = {
      query: async () => ({
        rows: [
          {
            id,
            account_type: 'platform',
            subdomain: '',
            expires_at: null,
            code_hash: createHmac('sha256', secret)
              .update(`analytics-share:${id}:${code}`)
              .digest('hex'),
          },
        ],
      }),
    };
    service = new AnalyticsSharingService(
      database as never,
      redis,
      config,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });
  beforeEach(() => {
    id = randomUUID();
  });
  afterAll(async () => {
    if (redis) {
      await redis.deleteByPattern('*');
      redis.onModuleDestroy();
    }
  });

  it('admits more than fifty successful viewers without exhausting guessing budgets', async () => {
    for (let n = 0; n < 60; n++)
      await expect(
        service.unlock(id, code, `viewer-${n}`),
      ).resolves.toHaveProperty('token');
    expect(
      await redis.getClient().get(`rl:analytics-share:failures:link:${id}`),
    ).toBeNull();
  });

  it('atomically bounds concurrent incorrect guesses across viewers', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 100 }, (_, n) =>
        service.unlock(id, '000000', `attacker-${n}`),
      ),
    );
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(
      await redis.getClient().get(`rl:analytics-share:failures:link:${id}`),
    ).toBe('50');
    await expect(service.unlock(id, code, 'new-viewer')).rejects.toMatchObject({
      status: 401,
    });
  });
});
