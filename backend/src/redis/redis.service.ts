import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const GET_AND_DELETE_SCRIPT = `
local value = redis.call('GET', KEYS[1])
if value then
  redis.call('DEL', KEYS[1])
end
return value
`;

const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private isRedisAvailable = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const keyPrefix = this.configService.get<string>('REDIS_KEY_PREFIX', '');

    try {
      this.redis = new Redis({
        host,
        port,
        keyPrefix,
        maxRetriesPerRequest: 1,
        reconnectOnError: () => true,
      });

      this.redis.on('connect', () => {
        this.logger.log(`📡 Redis connected successfully to ${host}:${port}`);
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`⚠️ Redis client connection error: ${err.message}`);
        this.isRedisAvailable = false;
      });
    } catch (error) {
      this.logger.error('❌ Failed to initialize Redis client', error);
      this.isRedisAvailable = false;
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  isAvailable(): boolean {
    return this.isRedisAvailable && !!this.redis;
  }

  async ping(): Promise<void> {
    if (!this.redis) throw new Error('Redis is unavailable');
    const response = await this.redis.ping();
    if (response !== 'PONG') throw new Error('Redis health check failed');
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      this.logger.warn('Redis cache get failed');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 7200): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
      return true;
    } catch {
      this.logger.warn('Redis cache set failed');
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch {
      this.logger.warn('Redis cache delete failed');
      return false;
    }
  }

  async consume<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    try {
      const raw = await this.redis.eval(GET_AND_DELETE_SCRIPT, 1, key);
      if (typeof raw !== 'string') return null;
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn('Redis one-time consume failed');
      return null;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    let cursor = '0';
    let deleted = 0;
    const keyPrefix = this.redis.options.keyPrefix || '';
    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${keyPrefix}${pattern}`,
          'COUNT',
          250,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          // SCAN returns physical keys; DEL adds keyPrefix automatically.
          const logicalKeys = keys
            .filter((key) => key.startsWith(keyPrefix))
            .map((key) => key.slice(keyPrefix.length));
          if (logicalKeys.length > 0)
            deleted += await this.redis.del(...logicalKeys);
        }
      } while (cursor !== '0');
      return deleted;
    } catch (error) {
      this.logger.warn(
        `⚠️ Redis cache deletion error for pattern "${pattern}":`,
        error,
      );
      return deleted;
    }
  }

  async trackBusinessSession(
    businessId: string,
    sessionToken: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const key = `business:sessions:${businessId}`;
      await this.redis.sadd(key, sessionToken);
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      this.logger.warn(
        `⚠️ Redis error tracking session for business "${businessId}":`,
        error,
      );
      return false;
    }
  }

  async untrackBusinessSession(
    businessId: string,
    sessionToken: string,
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const key = `business:sessions:${businessId}`;
      await this.redis.srem(key, sessionToken);
      return true;
    } catch (error) {
      this.logger.warn(
        `⚠️ Redis error untracking session for business "${businessId}":`,
        error,
      );
      return false;
    }
  }

  async clearBusinessSessions(businessId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const key = `business:sessions:${businessId}`;
      const tokens = await this.redis.smembers(key);
      const pipeline = this.redis.pipeline();
      for (const token of tokens) {
        pipeline.del(`session:${token}`);
      }
      pipeline.del(key);
      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.warn(
        `⚠️ Redis error clearing sessions for business "${businessId}":`,
        error,
      );
      return false;
    }
  }

  async isRateLimited(
    key: string,
    limit = 60,
    windowSeconds = 60,
    options: { failClosed?: boolean } = {},
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      if (options.failClosed)
        throw new ServiceUnavailableException(
          'Request limiting is temporarily unavailable',
        );
      return false;
    }
    try {
      // Atomic expiry also repairs orphan counters without sliding live windows.
      const current = Number(
        await this.redis.eval(RATE_LIMIT_SCRIPT, 1, key, windowSeconds),
      );
      return current > limit;
    } catch {
      this.logger.warn('Redis rate limit failed');
      if (options.failClosed)
        throw new ServiceUnavailableException(
          'Request limiting is temporarily unavailable',
        );
      return false;
    }
  }
}
