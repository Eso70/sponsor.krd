import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateLinktreeDto } from './dto/update-linktree.dto';
import { buildSyncLinks } from './linktree-links';

/** Guards run before Nest's DTO pipes, so queued edits validate here as well. */
export function validateLinktreeUpdate(
  input: unknown,
): asserts input is UpdateLinktreeDto {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new BadRequestException('Invalid Linktree update');
  const dto = plainToInstance(UpdateLinktreeDto, input);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length) throw new BadRequestException('Invalid Linktree update');
  if (dto.links !== undefined) buildSyncLinks(dto);
}
