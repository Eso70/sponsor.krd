import {
  IsArray,
  IsIn,
  Matches,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  WEBSITE_COLOR_MAX_LENGTH,
  WEBSITE_COLOR_PATTERN,
} from '../../common/website-color';
import { BACKGROUND_PATTERN_STYLES } from '@linktree/types/linktree-defaults.cjs';

export enum SettingsSection {
  Profile = 'profile',
  Defaults = 'defaults',
  Integrations = 'integrations',
}

export class UpdateSettingsDto {
  @IsEnum(SettingsSection)
  section!: SettingsSection;

  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(80) username?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) logo?: string;
  @IsOptional() @IsString() @MaxLength(500) favicon?: string;
  @IsOptional() @IsString() @MaxLength(500) default_avatar?: string;
  @IsOptional() @IsString() @MaxLength(100) website_color?: string;

  @IsOptional() @IsString() @MaxLength(2000) default_footer_text?: string;
  @IsOptional() @IsString() @MaxLength(40) default_footer_phone?: string;
  @IsOptional() @IsString() @MaxLength(80) default_template?: string;
  @IsOptional()
  @IsString()
  @MaxLength(WEBSITE_COLOR_MAX_LENGTH)
  @Matches(WEBSITE_COLOR_PATTERN)
  default_background_color?: string;
  @IsOptional()
  @IsIn(BACKGROUND_PATTERN_STYLES)
  default_background_pattern?: string;
  @IsOptional() @IsBoolean() default_footer_hidden?: boolean;
  @IsOptional() @IsBoolean() default_whatsapp_enabled?: boolean;
  @IsOptional() @IsBoolean() homepage_linktree?: boolean;

  @IsOptional() @IsArray() tiktok_configs?: unknown[];
  @IsOptional() @IsString() @MaxLength(100) pixel_id?: string;
  @IsOptional() @IsString() @MaxLength(500) events_token?: string;
}
