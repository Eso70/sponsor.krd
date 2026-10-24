/** The preset options shown in the time-range filter strip. */
export type DateRangePreset = "today" | "24h" | "7d" | "all" | "custom";

function toLocalDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Converts a preset (plus optional custom bounds) to the `from`/`to` query
 * param pair the backend expects (`YYYY-MM-DD` strings, or undefined for
 * all-time / missing bound).
 */
export function presetToRange(
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from?: string; to?: string } {
  if (preset === "today") {
    // Calendar-day ranges; the two-day option is labeled explicitly.
    return { from: toLocalDateString(new Date()) };
  }
  if (preset === "24h") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { from: toLocalDateString(d) };
  }
  if (preset === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { from: toLocalDateString(d) };
  }
  if (preset === "custom") {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }
  // "all" — no bounds
  return {};
}
