import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { PlatformLocaleService } from './platform-locale.service';
import { UpdatePlatformPreferredLocaleDto } from './dto/update-platform-preferred-locale.dto';

describe('platform administrator preferred locale', () => {
  const query = jest.fn();
  const service = new PlatformLocaleService({ query } as never);

  beforeEach(() => query.mockReset());

  it('accepts Kurdish, Arabic, and English only', async () => {
    const dto = new UpdatePlatformPreferredLocaleDto();
    dto.locale = 'ar';
    expect(await validate(dto)).toHaveLength(0);
    dto.locale = 'en';
    expect(await validate(dto)).toHaveLength(0);
    dto.locale = 'fr' as never;
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('reads the signed-in administrator preference', async () => {
    query.mockResolvedValue({ rows: [{ preferred_locale: 'ar' }] });
    await expect(service.getPreferredLocale('admin-id')).resolves.toBe('ar');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      ['admin-id'],
    );
  });

  it('updates only the signed-in administrator row', async () => {
    query.mockResolvedValue({ rows: [{ preferred_locale: 'en' }] });
    await expect(service.updatePreferredLocale('admin-id', 'en')).resolves.toBe(
      'en',
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1 RETURNING'),
      ['admin-id', 'en'],
    );
  });

  it('rejects a missing administrator', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(
      service.updatePreferredLocale('missing', 'ar'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
