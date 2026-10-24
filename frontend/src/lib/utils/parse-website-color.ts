export interface ParsedColor {
  type: "solid" | "gradient";
  css: string; // Ready-to-use CSS value
  primary: string; // Primary hex color (for focus rings, borders)
  raw: string; // Original input string
}

export const WEBSITE_GRADIENT_DIRECTIONS = [
  "to-r",
  "to-l",
  "to-b",
  "to-t",
  "to-br",
  "to-bl",
  "to-tr",
  "to-tl",
  "radial",
] as const;

export type WebsiteGradientDirection =
  (typeof WEBSITE_GRADIENT_DIRECTIONS)[number];

export const WEBSITE_GRADIENT_DIRECTION_CSS: Record<
  Exclude<WebsiteGradientDirection, "radial">,
  string
> = {
  "to-r": "to right",
  "to-l": "to left",
  "to-b": "to bottom",
  "to-t": "to top",
  "to-br": "to bottom right",
  "to-bl": "to bottom left",
  "to-tr": "to top right",
  "to-tl": "to top left",
};

const SOLID_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const GRADIENT_COLOR_PATTERN =
  /^gradient:(to-r|to-l|to-b|to-t|to-br|to-bl|to-tr|to-tl|radial):(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}):(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})$/;

export interface WebsiteGradient {
  /** Finished CSS, carrying the direction the owner chose. */
  css: string;
  from: string;
  to: string;
}

/**
 * The two stops and finished CSS of a `gradient:direction:from:to` value.
 *
 * The single reader of that format. Surfaces that need the stops as well as the
 * CSS — the linktree background recipe, for one — used to carry their own
 * looser regex, which accepted 4- and 5-digit hex this parser rejects and fell
 * back to a different direction for an unrecognised one. Two answers for one
 * stored string is one too many; ask here instead.
 */
export function parseWebsiteGradient(
  value: string | null | undefined,
): WebsiteGradient | null {
  const parsed = parseWebsiteColor(value);
  if (parsed.type !== "gradient") return null;
  const match = parsed.raw.match(GRADIENT_COLOR_PATTERN);
  if (!match) return null;
  const [, , from, to] = match;
  return { css: parsed.css, from, to };
}

export function isWebsiteColor(value: string | null | undefined): boolean {
  const trimmed = value?.trim() || "";
  return (
    SOLID_COLOR_PATTERN.test(trimmed) || GRADIENT_COLOR_PATTERN.test(trimmed)
  );
}

export function parseWebsiteColor(
  value: string | null | undefined,
): ParsedColor {
  const DEFAULT: ParsedColor = {
    type: "solid",
    css: "#000000",
    primary: "#000000",
    raw: "#000000",
  };

  if (!value || !value.trim()) return DEFAULT;

  const trimmed = value.trim();

  // Check hex format: #RGB or #RRGGBB
  if (SOLID_COLOR_PATTERN.test(trimmed)) {
    return { type: "solid", css: trimmed, primary: trimmed, raw: trimmed };
  }

  // Check gradient format: gradient:direction:from:to
  const gradientMatch = trimmed.match(GRADIENT_COLOR_PATTERN);
  if (gradientMatch) {
    const [, rawDirection, from, to] = gradientMatch;
    const direction = rawDirection as WebsiteGradientDirection;
    // Explicit 0%/100% stops: both colours get exactly half the surface, with
    // the blend centred. Written out rather than left to the CSS default so a
    // later edit cannot quietly reintroduce a third stop and push the midpoint
    // off centre, which is what made one colour dominate before.
    return {
      type: "gradient",
      css:
        direction === "radial"
          ? `radial-gradient(circle, ${from} 0%, ${to} 100%)`
          : `linear-gradient(${WEBSITE_GRADIENT_DIRECTION_CSS[direction]}, ${from} 0%, ${to} 100%)`,
      primary: from,
      raw: trimmed,
    };
  }

  return DEFAULT;
}

/**
 * Text or icon colour that stays legible on top of `hex`.
 *
 * Shared rather than recomputed per surface: a business picking a pale colour
 * must get dark ink on every control that fills with it, not only on the ones
 * whose author remembered to check.
 */
export function readableInk(hex: string): string {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((index) =>
    Number.parseInt(normalized.slice(index, index + 2), 16),
  );
  // Compare actual sRGB contrast, rather than perceived brightness. Saturated
  // colors and middle grays are where the old brightness shortcut failed.
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const darkLuminance =
    0.2126 * linear(17) + 0.7152 * linear(24) + 0.0722 * linear(39);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast =
    (Math.max(luminance, darkLuminance) + 0.05) /
    (Math.min(luminance, darkLuminance) + 0.05);
  if (whiteContrast >= darkContrast && whiteContrast >= 4.5) return "#ffffff";
  if (darkContrast >= 4.5) return "#111827";
  // Near middle gray, black meets 4.5:1 when neither white nor slate does.
  return "#000000";
}

export function formatWebsiteColor(parsed: ParsedColor): string {
  if (parsed.type === "solid") return parsed.primary;
  // Reconstruct from raw for gradient
  return parsed.raw;
}
