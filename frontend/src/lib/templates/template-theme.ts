import type { TemplateTheme } from "@/components/templates/types";
import { getBackgroundGradient, DEFAULT_BACKGROUND_COLOR } from "@/lib/config/background-gradients";
import { readBackgroundImage } from "./background-image";
import { readBackgroundPattern } from "./background-pattern";
import { deriveAccentColor, deriveBorderColor, deriveTextColor, deriveTextSecondaryColor, deriveHighlightColor } from "@/lib/utils/theme-colors";

/** One palette resolver for published pages and unsaved editor previews. */
export function createLinktreeTemplateTheme(backgroundColor?: string | null, config?: Record<string, unknown> | null): TemplateTheme {
  const base = getBackgroundGradient(backgroundColor || DEFAULT_BACKGROUND_COLOR);
  return {
    ...base,
    backgroundImage: readBackgroundImage(config),
    backgroundPattern: readBackgroundPattern(config),
    accent: deriveAccentColor(base.from, base.via, base.to),
    border: deriveBorderColor(base.from, base.via, base.to, 0.3),
    text: deriveTextColor(base.from, base.via, base.to),
    textSecondary: deriveTextSecondaryColor(base.from, base.via, base.to),
    highlight: deriveHighlightColor(base.from, base.via, base.to),
  };
}
