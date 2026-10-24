import {
  IsIn,
  IsString,
  Matches,
  IsOptional,
  IsISO8601,
  IsBoolean,
} from 'class-validator';

export class CreateAnalyticsShareDto {
  @IsOptional()
  @IsBoolean()
  includeSubmissions?: boolean;
  @IsOptional()
  @IsIn(['never', 'hour', 'day', 'week', 'month', 'custom'])
  expiry?: 'never' | 'hour' | 'day' | 'week' | 'month' | 'custom';

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string;

  @IsIn(['en', 'ar', 'ckb'])
  locale!: 'en' | 'ar' | 'ckb';
}

export class UnlockAnalyticsShareDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class SharedAnalyticsReportQueryDto {
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  responsePage?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  to?: string;
}
