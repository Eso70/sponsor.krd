/** Sources supported by the owner-scoped form image upload/render flow. */
export function isLocalRasterImage(value: string): boolean {
  return (
    /^\/images\/upload\/[a-zA-Z0-9_./-]+$/.test(value) ||
    (value.length <= 7_000_000 &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
  );
}

export function loadLocalRasterImage(src: string): Promise<HTMLImageElement> {
  if (!isLocalRasterImage(src))
    return Promise.reject(new Error("Invalid local image source"));
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      image.naturalWidth * image.naturalHeight <= 40_000_000
        ? resolve(image)
        : reject(new Error("Invalid image dimensions"));
    image.onerror = () => reject(new Error("Unable to decode local image"));
    image.src = src;
  });
}
