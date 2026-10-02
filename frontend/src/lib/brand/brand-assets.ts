/**
 * Single source of truth for branding asset fallbacks.
 *
 * The distinction this module exists to enforce: `/images/brand/rise.svg` is
 * SponsorKrd's own mark. It belongs to platform chrome — the home page, the
 * dashboard sidebar, the "powered by" footer, the platform manifest — and must
 * never stand in for a business that has not uploaded its own logo or favicon.
 * Painting the platform's logo onto a tenant surface misrepresents that
 * business, so tenant surfaces fall back to the neutral placeholders below.
 *
 * `DEFAULT_AVATAR` is a special case: it is also the value stored in
 * `business_branding.default_avatar` when no avatar was chosen, so backend SQL
 * compares against this exact string to mean "still the default". Changing it
 * requires a data migration, not just an edit here — see
 * `backend/src/common/brand-assets.ts`.
 */

/** One transparent, theme-aware logo for platform chrome and administrator avatars. */
export const SPONSOR_KRD_LOGO = "/images/brand/rise.svg";

/** Original artwork with a white center for surfaces that always stay dark. */
export const SPONSOR_KRD_ORIGINAL_LOGO = "/images/brand/rise-original.svg";

/** Raster export of the same mark for metadata and installed-app compatibility. */
export const SPONSOR_KRD_APP_ICON = "/images/brand/rise.png";

/** Original white-center Rise mark for browser tabs in every theme. */
export const SPONSOR_KRD_FAVICON = "/images/brand/rise-favicon-white.png";

export const SPONSOR_KRD_APPLE_ICON = "/images/brand/rise-apple.png";
export const SPONSOR_KRD_APP_ICON_SMALL = "/images/brand/rise-icon-192.png";

/** Neutral person mark used wherever a profile image is unset. */
export const DEFAULT_AVATAR = "/images/DefaultAvatar.png";

/** Neutral mark for a business that has not uploaded a logo. */
export const BUSINESS_LOGO_PLACEHOLDER =
  "/images/business-logo-placeholder.png";

/** Neutral mark for a business that has not uploaded a favicon. */
export const BUSINESS_FAVICON_PLACEHOLDER =
  "/images/business-favicon-placeholder.png";

/**
 * Upload types offered per branding slot. These mirror what
 * `backend/src/storage/image-upload.ts` accepts — widening a picker here
 * without widening that validator only moves the rejection later.
 *
 * The favicon accepts the raster formats too, because setup derives it from
 * the uploaded logo rather than asking for a separate `.ico`.
 */
export const LOGO_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
export const FAVICON_ACCEPT =
  ".ico,.png,.jpg,.jpeg,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg";
export const AVATAR_ACCEPT = ".png,image/png";

/** MIME allow-lists matching the pickers above, for client-side validation. */
export const LOGO_MIME_TYPES = ["image/jpeg", "image/png"];
export const FAVICON_MIME_TYPES = [
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/jpeg",
];
export const AVATAR_MIME_TYPES = ["image/png"];
