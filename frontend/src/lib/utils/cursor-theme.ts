import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";

let cursorAssetsPromise: Promise<[string, string]> | null = null;

function loadCursorAssets(): Promise<[string, string]> {
  cursorAssetsPromise ??= Promise.all([
    fetch("/cursors/customCursor.svg").then((response) => response.text()),
    fetch("/cursors/customTextSelect.svg").then((response) => response.text()),
  ]);
  return cursorAssetsPromise;
}

export async function applyCursorColor(
  accentColor: string,
  root: HTMLElement = document.documentElement,
  isActive: () => boolean = () => true,
): Promise<void> {
  const [defaultCursor, textCursor] = await loadCursorAssets();
  if (!isActive()) return;
  const tint = (svg: string) =>
    encodeURIComponent(svg.replaceAll(SPONSOR_KRD_ACCENT_COLOR, accentColor));

  root.style.setProperty(
    "--custom-cursor-default",
    `url("data:image/svg+xml,${tint(defaultCursor)}") 10 2, default`,
  );
  root.style.setProperty(
    "--custom-cursor-text",
    `url("data:image/svg+xml,${tint(textCursor)}") 16 16, text`,
  );
}

const CURSOR_GRADIENT_COORDINATES: Record<
  string,
  { x1: string; y1: string; x2: string; y2: string }
> = {
  "to-r": { x1: "0%", y1: "50%", x2: "100%", y2: "50%" },
  "to-l": { x1: "100%", y1: "50%", x2: "0%", y2: "50%" },
  "to-b": { x1: "50%", y1: "0%", x2: "50%", y2: "100%" },
  "to-t": { x1: "50%", y1: "100%", x2: "50%", y2: "0%" },
  "to-br": { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
  "to-bl": { x1: "100%", y1: "0%", x2: "0%", y2: "100%" },
  "to-tr": { x1: "0%", y1: "100%", x2: "100%", y2: "0%" },
  "to-tl": { x1: "100%", y1: "100%", x2: "0%", y2: "0%" },
};

function addCursorGradient(
  svg: string,
  direction: string,
  from: string,
  to: string,
): string {
  const definition =
    direction === "radial"
      ? `<radialGradient id="cursor-theme-gradient" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></radialGradient>`
      : (() => {
          const coordinates =
            CURSOR_GRADIENT_COORDINATES[direction] ??
            CURSOR_GRADIENT_COORDINATES["to-r"];
          return `<linearGradient id="cursor-theme-gradient" x1="${coordinates.x1}" y1="${coordinates.y1}" x2="${coordinates.x2}" y2="${coordinates.y2}"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`;
        })();
  const withGradientFill = svg.replaceAll(
    SPONSOR_KRD_ACCENT_COLOR,
    "url(#cursor-theme-gradient)",
  );
  return withGradientFill.includes("<defs>")
    ? withGradientFill.replace("<defs>", `<defs>${definition}`)
    : withGradientFill.replace(
        /(<svg\b[^>]*>)/,
        `$1<defs>${definition}</defs>`,
      );
}

/** Applies the complete configured gradient to platform cursors.
 * Business surfaces intentionally keep calling `applyCursorColor` with their
 * tenant-owned primary color.
 */
export async function applyCursorTheme(
  accentValue: string,
  root: HTMLElement = document.documentElement,
  isActive: () => boolean = () => true,
): Promise<void> {
  const accent = parseWebsiteColor(accentValue);
  if (accent.type === "solid") {
    await applyCursorColor(accent.primary, root, isActive);
    return;
  }

  const [, direction, from, to] = accent.raw.split(":");
  const [defaultCursor, textCursor] = await loadCursorAssets();
  if (!isActive()) return;
  const themed = (svg: string) =>
    encodeURIComponent(addCursorGradient(svg, direction, from, to));

  root.style.setProperty(
    "--custom-cursor-default",
    `url("data:image/svg+xml,${themed(defaultCursor)}") 10 2, default`,
  );
  root.style.setProperty(
    "--custom-cursor-text",
    `url("data:image/svg+xml,${themed(textCursor)}") 16 16, text`,
  );
}

export function resetCursorColor(
  root: HTMLElement = document.documentElement,
): void {
  root.style.removeProperty("--custom-cursor-default");
  root.style.removeProperty("--custom-cursor-text");
}
