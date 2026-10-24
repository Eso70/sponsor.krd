const ARROW =
  "M8 5.5 C7.2 4.9 6 5.6 6 6.9 L6 34 C6 36.3 8.7 37 10.1 35.2 L17.8 25.3 L29.8 25.1 C32.1 25 33 22.2 31.2 20.8 Z";
const HAND =
  "M14 22 V7 a3 3 0 0 1 6 0 v8 a3 3 0 0 1 6 0 v2 a3 3 0 0 1 6 0 v2 a3 3 0 0 1 6 0 v10 c0 8 -5 12 -12 12 h-3 c-4 0 -7 -2 -9 -5 L6 26 c-2 -3 2 -6 4 -3 l4 4 Z";

const TEXT =
  "M12 6 H17 Q20 6 20 9 Q20 6 23 6 H28 V9 H24 Q22 9 22 12 V32 Q22 35 24 35 H28 V38 H23 Q20 38 20 35 Q20 38 17 38 H12 V35 H16 Q18 35 18 32 V12 Q18 9 16 9 H12 Z";
const CURSORS = {
  default: {
    path: ARROW,
    width: 24,
    height: 26,
    viewBox: "0 0 40 44",
    hotspot: "4 3",
  },
  pointer: {
    path: HAND,
    width: 28,
    height: 30,
    viewBox: "0 0 46 49",
    hotspot: "10 3",
  },
  text: {
    path: TEXT,
    width: 24,
    height: 26,
    viewBox: "0 0 40 44",
    hotspot: "12 13",
  },
} as const;

function cursorAccent(accent: string): string {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent) ? accent : "#64748b";
}

/** White cursor artwork with a restrained, layered tenant-colored halo. */
function createCursor(accent: string, kind: keyof typeof CURSORS): string {
  const artwork = CURSORS[kind];
  const color = cursorAccent(accent);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${artwork.width}" height="${artwork.height}" viewBox="${artwork.viewBox}"><defs><filter id="cursor-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0.6" stdDeviation="2" flood-color="${color}" flood-opacity="0.2"/><feDropShadow dx="0" dy="0" stdDeviation="0.6" flood-color="${color}" flood-opacity="0.22"/></filter></defs><path d="${artwork.path}" filter="url(#cursor-glow)" fill="#FFFFFF" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  const hotspot = artwork.hotspot;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspot}, url("/cursors/${kind}.svg") ${hotspot}, ${kind}`;
}

export function createDefaultCursor(accent: string): string {
  return createCursor(accent, "default");
}

export function createPointerCursor(accent: string): string {
  return createCursor(accent, "pointer");
}

export function createTextCursor(accent: string): string {
  return createCursor(accent, "text");
}

/** One contract for server branding, live tenant settings and platform themes. */
export function createCursorVariables(accent: string): Record<string, string> {
  return {
    "--app-default-cursor": createDefaultCursor(accent),
    "--app-pointer-cursor": createPointerCursor(accent),
    "--app-text-cursor": createTextCursor(accent),
    "--app-cursor-accent": cursorAccent(accent),
  };
}
