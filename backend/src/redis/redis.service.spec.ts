import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Logger } from '@nestjs/common';

describe('Redis failure diagnostics', () => {
  it('never writes bearer keys or command arguments to logs', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    try {
      const service = new RedisService(new ConfigService());
      const fail = jest
        .fn()
        .mockRejectedValue(new Error('command session:secret-token'));
      Object.assign(service, {
        redis: { get: fail, set: fail, del: fail, eval: fail },
        isRedisAvailable: true,
      });
      await service.get('session:secret-token');
      await service.set('session:secret-token', { private: 'sensitive-value' });
      await service.del('session:secret-token');
      await service.consume('session:secret-token');
      expect(warn).toHaveBeenCalledTimes(4);
      expect(JSON.stringify(warn.mock.calls)).not.toMatch(
        /secret-token|sensitive-value/,
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('RedisService scoped cache cleanup', () => {
  it('never deletes keys outside its prefix even if SCAN returns them', async () => {
    const service = new RedisService(new ConfigService());
    const client = {
      options: { keyPrefix: 'e2e:unique-run:' },
      scan: jest.fn().mockResolvedValue(['0', ['production:key']]),
      del: jest.fn(),
    };
    Object.assign(service, { redis: client, isRedisAvailable: true });
    await expect(service.deleteByPattern('*')).resolves.toBe(0);
    expect(client.del).not.toHaveBeenCalled();
  });
  it.each(['', 'e2e:unique-run:'])(
    'deletes only matching keys with prefix %s',
    async (prefix) => {
      const service = new RedisService(new ConfigService());
      const client = {
        options: { keyPrefix: prefix },
        scan: jest
          .fn()
          .mockResolvedValue([
            '0',
            [`${prefix}cache:one`, `${prefix}cache:two`],
          ]),
        del: jest.fn().mockResolvedValue(2),
      };
      Object.assign(service, { redis: client, isRedisAvailable: true });
      await expect(service.deleteByPattern('cache:*')).resolves.toBe(2);
      expect(client.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        `${prefix}cache:*`,
        'COUNT',
        250,
      );
      expect(client.del).toHaveBeenCalledWith('cache:one', 'cache:two');
    },
  );
});

describe('RedisService one-time values', () => {
  it('atomically reads and deletes values without requiring GETDEL', async () => {
    const service = new RedisService(new ConfigService());
    const redis = {
      eval: jest.fn().mockResolvedValue(JSON.stringify({ state: 'valid' })),
    };
    Object.assign(service, { redis, isRedisAvailable: true });

    await expect(
      service.consume<{ state: string }>('oauth:state:hashed'),
    ).resolves.toEqual({ state: 'valid' });
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('DEL', KEYS[1])"),
      1,
      'oauth:state:hashed',
    );
  });

  it('returns null when one-time value is absent', async () => {
    const service = new RedisService(new ConfigService());
    const redis = { eval: jest.fn().mockResolvedValue(null) };
    Object.assign(service, { redis, isRedisAvailable: true });

    await expect(service.consume('missing')).resolves.toBeNull();
  });
});

describe('RedisService rate limiting', () => {
  function limiter(count: number) {
    const service = new RedisService(new ConfigService());
    const redis = { eval: jest.fn().mockResolvedValue(count) };
    Object.assign(service, { redis, isRedisAvailable: true });
    return { service, redis };
  }

  it('increments and repairs expiry in one atomic Redis operation', async () => {
    const { service, redis } = limiter(1);
    await expect(service.isRateLimited('rl:test', 5, 60)).resolves.toBe(false);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('TTL', KEYS[1]) < 0"),
      1,
      'rl:test',
      60,
    );
  });

  it('reports a caller over the limit', async () => {
    await expect(
      limiter(6).service.isRateLimited('rl:test', 5, 60),
    ).resolves.toBe(true);
  });

  it('preserves optional fail-open behavior for existing callers', async () => {
    await expect(
      new RedisService(new ConfigService()).isRateLimited('rl:test', 5, 60),
    ).resolves.toBe(false);
  });

  it('rejects required limiting when Redis is unavailable or a command fails', async () => {
    const unavailable = new RedisService(new ConfigService());
    await expect(
      unavailable.isRateLimited('rl:test', 5, 60, { failClosed: true }),
    ).rejects.toMatchObject({ status: 503 });
    const { service, redis } = limiter(1);
    redis.eval.mockRejectedValue(new Error('Redis unavailable'));
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    try {
      await expect(
        service.isRateLimited('rl:test', 5, 60, { failClosed: true }),
      ).rejects.toMatchObject({ status: 503 });
    } finally {
      warn.mockRestore();
    }
  });
});
