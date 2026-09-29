import { IsIn } from 'class-validator';

export class UpdatePlatformPreferredLocaleDto {
  @IsIn(['ckb', 'ar', 'en'])
  locale!: 'ckb' | 'ar' | 'en';
}
