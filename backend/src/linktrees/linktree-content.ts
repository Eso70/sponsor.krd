import { BadRequestException } from '@nestjs/common';
import type { CreateLinktreeDto } from './dto/create-linktree.dto';
import type { UpdateLinktreeDto } from './dto/update-linktree.dto';

export function normalizeLinktreeContent<
  T extends CreateLinktreeDto | UpdateLinktreeDto,
>(input: T) {
  const name = input.headline !== undefined ? input.headline : input.name;
  if (
    (input.headline !== undefined || input.name !== undefined) &&
    (typeof name !== 'string' || name.trim().length < 2 || name.length > 255)
  )
    throw new BadRequestException('Invalid headline');
  return {
    ...input,
    name: name?.trim(),
    subtitle: input.slogan !== undefined ? input.slogan : input.subtitle,
    subtitle_color:
      input.slogan_color !== undefined
        ? input.slogan_color
        : input.subtitle_color,
    image: input.logo !== undefined ? input.logo : input.image,
  };
}
export function normalizeLinktreeCreate(input: CreateLinktreeDto) {
  const data = normalizeLinktreeContent(input);
  if (
    typeof data.name !== 'string' ||
    data.name.trim().length < 2 ||
    data.name.length > 255
  )
    throw new BadRequestException('Invalid headline');
  return { ...data, name: data.name.trim() };
}
