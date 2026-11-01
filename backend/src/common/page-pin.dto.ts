import { IsBoolean } from 'class-validator';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export const PAGE_PIN_MUTATION = 'page-pin-mutation';

export class PagePinDto {
  @IsBoolean()
  isPinned!: boolean;
}

export function validatePagePin(input: unknown): asserts input is PagePinDto {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    validateSync(plainToInstance(PagePinDto, input), {
      whitelist: true,
      forbidNonWhitelisted: true,
    }).length
  ) {
    throw new BadRequestException('Invalid page pin request');
  }
}
