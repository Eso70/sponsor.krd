// Runtime-safe defaults shared by Node services and the browser.
const BACKGROUND_PATTERN_STYLES = Object.freeze(["none", "grid", "grid45", "dots", "diagonal", "cross", "circles", "waves", "zigzag"]);
const DEFAULT_LINKTREE_BACKGROUND_COLOR = "#161b22";
const DEFAULT_LINKTREE_BACKGROUND_PATTERN = "grid45";
function resolveNewPagePattern(value) {
  return BACKGROUND_PATTERN_STYLES.includes(value) ? value : DEFAULT_LINKTREE_BACKGROUND_PATTERN;
}
module.exports = { BACKGROUND_PATTERN_STYLES, DEFAULT_LINKTREE_BACKGROUND_COLOR, DEFAULT_LINKTREE_BACKGROUND_PATTERN, resolveNewPagePattern };
