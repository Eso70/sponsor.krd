export interface LinktreeBanner {
  enabled: boolean;
  mode: "image" | "carousel";
  images: string[];
}
export const LINKTREE_BANNER_KEY: "banner";
export const LINKTREE_BANNER_MAX_IMAGES: 5;
export function readLinktreeBanner(
  value: unknown,
  validImage?: (value: string) => boolean,
): LinktreeBanner;
