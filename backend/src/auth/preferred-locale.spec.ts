import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { UpdatePreferredLocaleDto } from './dto/update-preferred-locale.dto';

describe('business preferred locale', () => {
  const query = jest.fn();
  const service = new AuthService({ query } as never, {} as never);

  beforeEach(() => query.mockReset());

  it('accepts only supported locale values', async () => {
    const valid = new UpdatePreferredLocaleDto();
    valid.locale = 'ar';
    expect(await validate(valid)).toHaveLength(0);

    const english = new UpdatePreferredLocaleDto();
    english.locale = 'en';
    expect(await validate(english)).toHaveLength(0);

    const invalid = new UpdatePreferredLocaleDto();
    invalid.locale = 'fr' as never;
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('reads the signed-in member preference within the current business', async () => {
    query.mockResolvedValue({ rows: [{ preferred_locale: 'ar' }] });
    await expect(
      service.getBusinessPreferredLocale('business-id', 'user-id'),
    ).resolves.toBe('ar');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('membership.business_id = $2'),
      ['user-id', 'business-id'],
    );
  });

  it('persists English only for an active member of the current business', async () => {
    query.mockResolvedValue({ rows: [{ preferred_locale: 'en' }] });
    await expect(
      service.updateBusinessPreferredLocale('business-id', 'user-id', 'en'),
    ).resolves.toBe('en');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("membership.status = 'active'"),
      ['user-id', 'business-id', 'en'],
    );
  });

  it('does not write when the session has no member identity', async () => {
    await expect(
      service.updateBusinessPreferredLocale('business-id', undefined, 'ar'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(query).not.toHaveBeenCalled();
  });

  it('refuses to write when membership is no longer active', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(
      service.updateBusinessPreferredLocale('business-id', 'user-id', 'ar'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("membership.status = 'active'"),
      ['user-id', 'business-id', 'ar'],
    );
  });
});
