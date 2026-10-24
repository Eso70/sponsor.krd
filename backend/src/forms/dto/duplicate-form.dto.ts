import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { FormDraft } from '@linktree/types';

export class DuplicateFormDto {
  @IsOptional()
  @IsObject()
  definition?: FormDraft;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9][a-z0-9-]+$/)
  slug?: string;
}
