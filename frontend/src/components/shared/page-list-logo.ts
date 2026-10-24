import { DEFAULT_AVATAR } from "@/lib/brand/brand-assets";

/** Legacy system placeholders are unset; only an authored logo or owner avatar is shown. */
export function pageListLogo(
  logo?: string | null,
  businessAvatar?: string | null,
): string | null {
  return (
    [logo, businessAvatar]
      .map((value) => value?.trim())
      .find((value) => value && value !== DEFAULT_AVATAR) || null
  );
}
