export const BACKGROUND_PATTERN_STYLES: readonly ["none", "grid", "grid45", "dots", "diagonal", "cross", "circles", "waves", "zigzag"];
export const DEFAULT_LINKTREE_BACKGROUND_COLOR: "#161b22";
export const DEFAULT_LINKTREE_BACKGROUND_PATTERN: "grid45";
export function resolveNewPagePattern(value: unknown): typeof BACKGROUND_PATTERN_STYLES[number];
