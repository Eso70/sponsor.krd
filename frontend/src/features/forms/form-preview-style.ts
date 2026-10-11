import type { CSSProperties } from "react";
import {
  isWebsiteColor,
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";
export function formPreviewStyle(color: string): CSSProperties {
  const accent = parseWebsiteColor(isWebsiteColor(color) ? color : "#16a34a");
  return {
    "--preview-accent": accent.primary,
    "--preview-accent-fill": accent.css,
    "--preview-accent-ink": readableInk(accent.primary),
  } as CSSProperties;
}
