import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { LINKTREE_BANNER_MAX_IMAGES } from '@linktree/types/linktree-banner.cjs';

export class LinktreeBannerDto {
  @IsBoolean()
  enabled!: boolean;

  @IsIn(['image', 'carousel'])
  mode!: 'image' | 'carousel';

  @IsArray()
  @ArrayMaxSize(LINKTREE_BANNER_MAX_IMAGES)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(/^\/images\/upload\/[A-Za-z0-9._\-/]+$/, { each: true })
  images!: string[];
}
