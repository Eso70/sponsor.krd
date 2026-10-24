import { PublicBrandingController } from './public-branding.controller';
import { NotFoundException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import sharp from 'sharp';

function setup() {
  const storage = { readUploadedAsset: jest.fn() };
  const controller = new PublicBrandingController(
    storage as never,
    { getBranding: jest.fn() } as never,
    { isRateLimited: jest.fn().mockResolvedValue(false) } as never,
  );
  const reply = {
    header: jest.fn<unknown, [string, string]>().mockReturnThis(),
    code: jest.fn<unknown, [number]>().mockReturnThis(),
    send: jest.fn<unknown, [Buffer?]>(),
  };
  return { storage, controller, reply };
}
describe('public favicon boundary', () => {
  it.each([
    'https://untrusted.invalid/logo.png',
    '//untrusted.invalid/logo.png',
    '/private/image.png',
    '/images/upload/../secret.png',
    '/images/upload/%2e%2e/secret.png',
    '/images/upload/icon.svg',
  ])('rejects arbitrary path %s before reading', async (asset) => {
    const { controller, storage, reply } = setup();
    await expect(
      controller.icon(
        asset,
        { headers: {}, ip: '127.0.0.1' } as FastifyRequest,
        reply as unknown as FastifyReply,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.readUploadedAsset).not.toHaveBeenCalled();
  });
  it('caches derived icons and supports conditional requests', async () => {
    const { controller, storage, reply } = setup();
    storage.readUploadedAsset.mockResolvedValue(
      await sharp({
        create: { width: 20, height: 20, channels: 4, background: '#112233' },
      })
        .png()
        .toBuffer(),
    );
    await controller.icon(
      '/images/upload/businesses/id/logo.png',
      { headers: {}, ip: '127.0.0.1' } as FastifyRequest,
      reply as unknown as FastifyReply,
    );
    const etag = reply.header.mock.calls.find(([key]) => key === 'ETag')?.[1];
    if (!etag) throw new Error('Missing ETag');
    expect(reply.header).toHaveBeenCalledWith('Content-Type', 'image/x-icon');
    expect(reply.send.mock.calls[0][0]).toBeInstanceOf(Buffer);
    await controller.icon(
      '/images/upload/businesses/id/logo.png',
      {
        headers: { 'if-none-match': etag },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest,
      reply as unknown as FastifyReply,
    );
    expect(storage.readUploadedAsset).toHaveBeenCalledTimes(1);
    expect(reply.code).toHaveBeenCalledWith(304);
  });
});
