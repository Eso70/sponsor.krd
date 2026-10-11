import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsDateString,
  IsUUID,
  MinLength,
} from 'class-validator';
export class FormTitleDto {
  @IsString() @MinLength(1) @MaxLength(100) title!: string;
  @IsOptional() @IsUUID() excludeId?: string;
}
export class FormsPageDto {
  @IsOptional() @Matches(/^\d{1,6}$/) page = '0';
}
export class FormResponsesDto extends FormsPageDto {
  @IsOptional() @IsString() @MaxLength(100) q = '';
  @IsOptional() @IsIn(['20', '50', '100']) pageSize = '20';
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to?: string;
  @IsOptional() @IsDateString({ strict: true }) before?: string;

  filters(): import('@linktree/types').FormSubmissionFilters {
    return {
      q: this.q,
      from: this.from,
      to: this.to,
      before: this.before,
      pageSize:
        this.pageSize === '100' ? 100 : this.pageSize === '50' ? 50 : 20,
    };
  }
}
export class FormsListDto extends FormsPageDto {
  @IsOptional() @IsString() @MaxLength(100) q = '';
  @IsOptional() @IsIn(['active', 'archived']) filter = 'active';
}
