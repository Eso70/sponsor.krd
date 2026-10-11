/** Small, premultiplied raster Gaussian blur; portable to browsers without canvas filters. */
export function gaussianBlurPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const sigma = 2.4;
  const radius = Math.ceil(sigma * 3);
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, index) =>
    Math.exp(-((index - radius) ** 2) / (2 * sigma ** 2)),
  );
  const total = kernel.reduce((sum, weight) => sum + weight, 0);
  const weights = kernel.map((weight) => weight / total);
  const source = new Float32Array(data.length);
  const horizontal = new Float32Array(data.length);
  const vertical = new Float32Array(data.length);
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    for (let channel = 0; channel < 3; channel++)
      source[index + channel] = data[index + channel] * alpha;
    source[index + 3] = data[index + 3];
  }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      for (let step = -radius; step <= radius; step++) {
        const sample =
          (y * width + Math.max(0, Math.min(width - 1, x + step))) * 4;
        for (let channel = 0; channel < 4; channel++)
          horizontal[offset + channel] +=
            source[sample + channel] * weights[step + radius];
      }
    }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      for (let step = -radius; step <= radius; step++) {
        const sample =
          (Math.max(0, Math.min(height - 1, y + step)) * width + x) * 4;
        for (let channel = 0; channel < 4; channel++)
          vertical[offset + channel] +=
            horizontal[sample + channel] * weights[step + radius];
      }
    }
  const output = new Uint8ClampedArray(data.length);
  for (let index = 0; index < data.length; index += 4) {
    const alpha = vertical[index + 3] / 255;
    for (let channel = 0; channel < 3; channel++)
      output[index + channel] = alpha ? vertical[index + channel] / alpha : 0;
    output[index + 3] = vertical[index + 3];
  }
  return output;
}
