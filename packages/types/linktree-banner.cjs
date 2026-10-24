// One runtime implementation shared by Node and the frontend bundler.
const LINKTREE_BANNER_KEY = "banner";
const LINKTREE_BANNER_MAX_IMAGES = 5;

function readLinktreeBanner(value, validImage = (image) =>
  /^\/images\/upload\/[A-Za-z0-9._\-/]+$/.test(image) &&
  !/(^|\/)\.\.(\/|$)/.test(image)) {
  const banner = value && typeof value === "object" && !Array.isArray(value)
    ? value : {};
  return {
    enabled: banner.enabled === true,
    mode: banner.mode === "carousel" ? "carousel" : "image",
    images: Array.isArray(banner.images)
      ? banner.images.filter((image) => typeof image === "string" && validImage(image)).slice(0, LINKTREE_BANNER_MAX_IMAGES)
      : [],
  };
}

exports.LINKTREE_BANNER_KEY = LINKTREE_BANNER_KEY;
exports.LINKTREE_BANNER_MAX_IMAGES = LINKTREE_BANNER_MAX_IMAGES;
exports.readLinktreeBanner = readLinktreeBanner;
