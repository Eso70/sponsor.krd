import sharp from 'sharp';

/** A real multi-resolution ICO directory containing lossless PNG frames. */
export async function imageToIco(source: Buffer): Promise<Buffer> {
  if (source.length > 10 * 1024 * 1024)
    throw new Error('Icon source is too large');
  if (source.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) return source;
  const metadata = await sharp(source, {
    limitInputPixels: 16_777_216,
  }).metadata();
  if (!['png', 'jpeg'].includes(metadata.format || ''))
    throw new Error('Unsupported icon source');
  const sizes = [16, 32, 48, 64];
  const frames = await Promise.all(
    sizes.map((size) =>
      sharp(source, { limitInputPixels: 16_777_216 })
        .rotate()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer(),
    ),
  );
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  frames.forEach((frame, index) => {
    const entry = 6 + index * 16;
    directory[entry] = sizes[index];
    directory[entry + 1] = sizes[index];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frame.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  });
  return Buffer.concat([directory, ...frames]);
}
