const ARROW = "M8 5.5 C7.2 4.9 6 5.6 6 6.9 L6 34 C6 36.3 8.7 37 10.1 35.2 L17.8 25.3 L29.8 25.1 C32.1 25 33 22.2 31.2 20.8 Z";
const HAND = "M14 22 V7 a3 3 0 0 1 6 0 v8 a3 3 0 0 1 6 0 v2 a3 3 0 0 1 6 0 v2 a3 3 0 0 1 6 0 v10 c0 8 -5 12 -12 12 h-3 c-4 0 -7 -2 -9 -5 L6 26 c-2 -3 2 -6 4 -3 l4 4 Z";

function cursorAccent(accent: string): string {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent) ? accent : "#64748b";
}

/** White cursor artwork with a restrained, layered tenant-colored halo. */
function createCursor(accent: string, pointer: boolean): string {
  const color = cursorAccent(accent);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pointer ? 28 : 24}" height="${pointer ? 30 : 26}" viewBox="0 0 ${pointer ? 46 : 40} ${pointer ? 49 : 44}"><defs><filter id="cursor-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0.6" stdDeviation="2" flood-color="${color}" flood-opacity="0.2"/><feDropShadow dx="0" dy="0" stdDeviation="0.6" flood-color="${color}" flood-opacity="0.22"/></filter></defs><path d="${pointer ? HAND : ARROW}" filter="url(#cursor-glow)" fill="#FFFFFF" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  const kind = pointer ? "pointer" : "default";
  const hotspot = pointer ? "10 3" : "4 3";
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspot}, url("/cursors/${kind}.svg") ${hotspot}, ${kind}`;
}

export function createDefaultCursor(accent: string): string {
  return createCursor(accent, false);
}

export function createPointerCursor(accent: string): string {
  return createCursor(accent, true);
}

/** One contract for server branding, live tenant settings and platform themes. */
export function createCursorVariables(accent: string): Record<string, string> {
  return {
    "--app-default-cursor": createDefaultCursor(accent),
    "--app-pointer-cursor": createPointerCursor(accent),
    "--app-cursor-accent": cursorAccent(accent),
  };
}
