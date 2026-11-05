import { ConfigService } from '@nestjs/config';
import { BusinessOnboardingService } from './business-onboarding.service';

describe('email challenge storage failures', () => {
  it.each(['business', 'admin', 'signup'] as const)(
    'does not send a %s code unless the challenge was stored',
    async (surface) => {
      const db = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'invitation',
              user_id: 'user',
              business_id: 'business',
              email: 'owner@example.test',
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              consumed_at: null,
              revoked_at: null,
            },
          ],
        }),
      };
      const redis = {
        isAvailable: () => true,
        isRateLimited: async () => false,
        set: jest.fn().mockResolvedValue(false),
      };
      const mail = {
        sendBusinessLoginCode: jest.fn(),
        sendAdminLoginCode: jest.fn(),
        sendBusinessSignupCode: jest.fn(),
      };
      const service = new BusinessOnboardingService(
        db as never,
        redis as never,
        {} as never,
        {} as never,
        {} as never,
        new ConfigService({
          SESSION_SECRET: 'test-secret-for-email-storage-regression',
          PLATFORM_ADMIN_EMAIL: 'owner@example.test',
        }),
        mail as never,
      );
      const result =
        surface === 'business'
          ? service.requestBusinessEmailCode('owner@example.test', 'tenant')
          : surface === 'admin'
            ? service.requestAdminEmailCode('owner@example.test')
            : service.requestSignupEmailCode(
                'i'.repeat(43),
                'owner@example.test',
              );
      await expect(result).rejects.toMatchObject({ status: 503 });
      expect(redis.set).toHaveBeenCalledTimes(1);
      for (const sender of Object.values(mail))
        expect(sender).not.toHaveBeenCalled();
    },
  );
});
