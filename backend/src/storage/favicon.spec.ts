import sharp from 'sharp';
import { imageToIco } from './favicon';

describe('ICO generation', () => {
  it.each(['png', 'jpeg'] as const)(
    'creates readable icon frames from %s',
    async (format) => {
      const source = await sharp({
        create: { width: 120, height: 60, channels: 4, background: '#123456' },
      })
        .toFormat(format)
        .toBuffer();
      const ico = await imageToIco(source);
      expect(ico.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
      expect(ico.readUInt16LE(4)).toBe(4);
      for (let index = 0; index < 4; index++) {
        const entry = 6 + index * 16;
        const start = ico.readUInt32LE(entry + 12),
          length = ico.readUInt32LE(entry + 8);
        const frame = await sharp(
          ico.subarray(start, start + length),
        ).metadata();
        expect(frame.width).toBe([16, 32, 48, 64][index]);
        expect(frame.height).toBe(frame.width);
        expect(frame.format).toBe('png');
      }
    },
  );
  it('rejects malformed and oversized sources', async () => {
    await expect(imageToIco(Buffer.from('invalid image'))).rejects.toThrow();
    await expect(imageToIco(Buffer.alloc(11 * 1024 * 1024))).rejects.toThrow();
  });
});
