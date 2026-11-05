import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PublicFormsController } from './public-forms.controller';
import { RedisService } from '../redis/redis.service';

describe('public form throttling failures', () => {
  it.each(['status', 'read', 'submit'] as const)(
    'returns 503 before %s touches form data if Redis is unavailable or fails',
    async (operation) => {
      const forms = {
        publicStatus: jest.fn(),
        publicForm: jest.fn(),
        submit: jest.fn(),
      };
      const redis = new RedisService(new ConfigService());
      const controller = new PublicFormsController(forms as never, redis);
      const request = { headers: {}, ip: '198.51.100.10' } as never;
      const invoke = () =>
        operation === 'submit'
          ? controller.submit('tenant', 'form', {}, request)
          : controller[operation]('tenant', 'form', request);
      await expect(invoke()).rejects.toMatchObject({ status: 503 });
      Object.assign(redis, {
        isRedisAvailable: true,
        redis: {
          eval: jest.fn().mockRejectedValue(new Error('Cache offline')),
        },
      });
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      try {
        await expect(invoke()).rejects.toMatchObject({ status: 503 });
      } finally {
        warn.mockRestore();
      }
      for (const method of Object.values(forms))
        expect(method).not.toHaveBeenCalled();
    },
  );
});
