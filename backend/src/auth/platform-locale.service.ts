import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type PlatformLocale = 'ckb' | 'ar' | 'en';

@Injectable()
export class PlatformLocaleService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getPreferredLocale(adminId: string): Promise<PlatformLocale> {
    const result = await this.databaseService.query<{
      preferred_locale: PlatformLocale;
    }>('SELECT preferred_locale FROM platform_admins WHERE id = $1', [adminId]);
    if (!result.rows[0]) throw new NotFoundException('Administrator not found');
    return result.rows[0].preferred_locale;
  }

  async updatePreferredLocale(
    adminId: string,
    locale: PlatformLocale,
  ): Promise<PlatformLocale> {
    const result = await this.databaseService.query<{
      preferred_locale: PlatformLocale;
    }>(
      `UPDATE platform_admins SET preferred_locale = $2, updated_at = NOW()
       WHERE id = $1 RETURNING preferred_locale`,
      [adminId, locale],
    );
    if (!result.rows[0]) throw new NotFoundException('Administrator not found');
    return result.rows[0].preferred_locale;
  }
}
