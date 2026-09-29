import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSignupApplicationDto } from './onboarding.dto';

describe('UpdateSignupApplicationDto', () => {
  it('accepts signup without social profiles, brand images, or color', async () => {
    const dto = plainToInstance(UpdateSignupApplicationDto, {
      ownerName: 'Ismail Dilshad',
      businessName: 'Acme Studio',
      phone: '7501234567',
      requestedSubdomain: 'acme-studio',
      preferredLocale: 'en',
      acceptTerms: true,
      acceptPrivacy: true,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects an unsupported dashboard language', async () => {
    const dto = plainToInstance(UpdateSignupApplicationDto, {
      businessName: 'Acme Studio',
      phone: '7501234567',
      requestedSubdomain: 'acme-studio',
      preferredLocale: 'fr',
    });
    expect(await validate(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'preferredLocale' }),
      ]),
    );
  });
});
