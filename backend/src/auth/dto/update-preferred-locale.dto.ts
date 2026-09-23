import { IsIn } from 'class-validator';

export class UpdatePreferredLocaleDto {
  @IsIn(['ckb', 'ar'])
  locale!: 'ckb' | 'ar';
}
