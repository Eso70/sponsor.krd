import sharp from 'sharp';
import type { FastifyRequest } from 'fastify';
import { StorageService } from '../storage/storage.service';
import { uploadFormImage } from './form-upload';
const request = (buffer: Buffer, mimetype = 'image/png', truncated = false) =>
  ({
    file: async () => ({
      mimetype,
      file: { truncated },
      toBuffer: async () => buffer,
    }),
  }) as unknown as FastifyRequest;
describe('form image uploads', () => {
  const storage = {
    uploadImage: jest
      .fn()
      .mockResolvedValue('/images/upload/businesses/owner/forms/image.png'),
    claimBusinessAssets: jest.fn(),
  } as unknown as StorageService;
  beforeEach(() => jest.clearAllMocks());
  it('decodes and normalizes a raster, limits dimensions and claims the owner asset', async () => {
    const png = await sharp({
      create: { width: 3000, height: 20, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    await uploadFormImage(request(png), storage, 'owner');
    const [bytes, key] = jest.mocked(storage.uploadImage).mock.calls[0];
    expect(key).toMatch(/^businesses\/owner\/forms\/[a-f0-9-]+\.png$/);
    expect((await sharp(bytes).metadata()).width).toBe(2048);
    expect(storage.claimBusinessAssets).toHaveBeenCalledWith(
      'owner',
      expect.any(String),
    );
  });
  it('rejects disguised SVGs, corrupt content, oversized and truncated uploads before storage', async () => {
    for (const input of [
      request(Buffer.from('<svg/>')),
      request(Buffer.alloc(5 * 1024 * 1024 + 1)),
      request(Buffer.alloc(1), 'image/png', true),
      request(Buffer.alloc(1), 'image/svg+xml'),
    ])
      await expect(uploadFormImage(input, storage, 'owner')).rejects.toThrow();
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });
});
