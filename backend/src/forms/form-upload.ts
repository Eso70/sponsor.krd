import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import type { FastifyRequest } from 'fastify';
import { StorageService } from '../storage/storage.service';
export async function uploadFormImage(
  request: FastifyRequest,
  storage: StorageService,
  owner: string,
) {
  const file = await request.file();
  if (
    !file ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
  )
    throw new BadRequestException('Choose a JPEG, PNG or WebP image');
  const buffer = await file.toBuffer();
  if (buffer.length > 5 * 1024 * 1024 || file.file.truncated)
    throw new BadRequestException('Image exceeds 5 MB');
  let decoded: Buffer;
  try {
    const image = sharp(buffer, { limitInputPixels: 40_000_000 });
    const meta = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format || ''))
      throw new Error('format');
    decoded = await image
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  } catch {
    throw new BadRequestException('Invalid image');
  }
  const url = await storage.uploadImage(
    decoded,
    `businesses/${owner}/forms/${randomUUID()}.png`,
  );
  await storage.claimBusinessAssets(owner, url);
  return { url };
}
