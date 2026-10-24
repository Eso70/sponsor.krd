import { IsBoolean } from 'class-validator';

export class PagePinDto {
  @IsBoolean()
  isPinned!: boolean;
}
