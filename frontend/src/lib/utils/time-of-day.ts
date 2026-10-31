/** Parse a stored time without a date, timezone, or daylight-saving conversion. */
export function parseTimeValue(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function toTimeValue(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Shared by the editor and public pages; `13:05` reads as `01:05 PM`. */
export function formatTimeValue(value: string, format: "12h" | "24h" = "12h"): string {
  const parsed = parseTimeValue(value);
  if (!parsed) return "";
  if (format === "24h") return toTimeValue(parsed.hours, parsed.minutes);
  const hour12 = parsed.hours % 12 || 12;
  const period = parsed.hours >= 12 ? "PM" : "AM";
  return `${String(hour12).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}
