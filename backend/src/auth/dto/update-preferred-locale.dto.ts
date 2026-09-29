import { IsIn } from 'class-validator';

export class UpdatePreferredLocaleDto {
  @IsIn(['ckb', 'ar', 'en'])
  locale!: 'ckb' | 'ar' | 'en';
}
