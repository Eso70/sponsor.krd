export interface AnalyticsTotals {
  total_views: number;
  unique_views: number;
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
  conversion_value: number;
  contact_actions: number | null;
}
export const EMPTY_ANALYTICS_TOTALS: AnalyticsTotals = {
  total_views: 0,
  unique_views: 0,
  total_clicks: 0,
  unique_clicks: 0,
  conversions: 0,
  conversion_value: 0,
  contact_actions: null,
};
/** A missing or malformed summary is unavailable, never an invented zero. */
export function readAnalyticsTotals(input: unknown): AnalyticsTotals {
  if (!input || typeof input !== "object")
    throw new Error("Invalid analytics summary");
  const data = input as Record<string, unknown>;
  for (const key of [
    "total_views",
    "unique_views",
    "total_clicks",
    "unique_clicks",
  ] as const) {
    if (
      typeof data[key] !== "number" ||
      !Number.isSafeInteger(data[key]) ||
      data[key] < 0
    )
      throw new Error("Invalid analytics summary");
  }
  const optional = (key: string) =>
    typeof data[key] === "number" && Number.isFinite(data[key]) ? data[key] : 0;
  const insights =
    data.insights && typeof data.insights === "object"
      ? (data.insights as Record<string, unknown>)
      : undefined;
  const contacts = insights?.contactActions;
  return {
    total_views: data.total_views as number,
    unique_views: data.unique_views as number,
    total_clicks: data.total_clicks as number,
    unique_clicks: data.unique_clicks as number,
    conversions: optional("conversions"),
    conversion_value: optional("conversion_value"),
    contact_actions:
      typeof contacts === "number" &&
      Number.isSafeInteger(contacts) &&
      contacts >= 0
        ? contacts
        : null,
  };
}
