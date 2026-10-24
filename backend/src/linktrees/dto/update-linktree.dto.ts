import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsObject,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  SOLID_HEX_COLOR_MAX_LENGTH,
  SOLID_HEX_COLOR_PATTERN,
  WEBSITE_COLOR_MAX_LENGTH,
  WEBSITE_COLOR_PATTERN,
} from '../../common/website-color';

export class UpdateLinktreeDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  headline?: string;

  @IsString()
  @IsOptional()
  slogan?: string;

  @IsString()
  @IsOptional()
  @MaxLength(SOLID_HEX_COLOR_MAX_LENGTH)
  @Matches(SOLID_HEX_COLOR_PATTERN)
  slogan_color?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(SOLID_HEX_COLOR_MAX_LENGTH)
  @Matches(SOLID_HEX_COLOR_PATTERN)
  subtitle_color?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  seo_name?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(WEBSITE_COLOR_MAX_LENGTH)
  @Matches(WEBSITE_COLOR_PATTERN)
  background_color?: string;

  @IsObject()
  @IsOptional()
  template_config?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  footer_text?: string;

  @IsString()
  @IsOptional()
  footer_phone?: string;

  @IsBoolean()
  @IsOptional()
  footer_hidden?: boolean;

  @IsBoolean()
  @IsOptional()
  is_archived?: boolean;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}

export class ToggleLinktreeArchiveDto {
  @IsBoolean()
  is_archived!: boolean;
}

export class ToggleLinktreeStatusDto {
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';
}
