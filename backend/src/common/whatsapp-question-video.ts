import { BadRequestException } from '@nestjs/common';
import { normalizeQuestionVideoUrl } from '@linktree/types/whatsapp-question.cjs';

export function questionVideoUrl(value: unknown): string | null {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && !value.trim())
  )
    return null;
  const url = normalizeQuestionVideoUrl(value);
  if (!url) throw new BadRequestException('Enter a valid video link');
  return url;
}
