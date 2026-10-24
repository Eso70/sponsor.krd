import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsIn,
  ValidateNested,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LinktreeBannerDto } from './linktree-banner.dto';
import {
  SOLID_HEX_COLOR_PATTERN,
  SOLID_HEX_COLOR_MAX_LENGTH,
  WEBSITE_COLOR_PATTERN,
  WEBSITE_COLOR_MAX_LENGTH,
} from '../../common/website-color';
import {
  LINKTREE_BACKGROUND_PATTERNS,
  type LinktreeBackgroundPattern,
} from '../../common/linktree-background-pattern';

export class DuplicateLinktreeDto {
  @IsOptional()
  @IsBoolean()
  verification_badge?: boolean;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LinktreeBannerDto)
  banner?: LinktreeBannerDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(SOLID_HEX_COLOR_MAX_LENGTH)
  @Matches(SOLID_HEX_COLOR_PATTERN)
  slogan_color?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(WEBSITE_COLOR_MAX_LENGTH)
  @Matches(WEBSITE_COLOR_PATTERN)
  background_color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(/^\/images\/upload\/[A-Za-z0-9._\-/]+$/)
  background_image?: string | null;

  @IsOptional()
  @IsIn(LINKTREE_BACKGROUND_PATTERNS)
  background_pattern?: LinktreeBackgroundPattern;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/)
  template_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(/^\/images\/upload\/[A-Za-z0-9._\-/]+$/)
  logo?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  headline?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  @MaxLength(50, { message: 'Slug must not exceed 50 characters' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name must be at least 1 character' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;
}
