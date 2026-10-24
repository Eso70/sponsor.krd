import type { FormMetrics } from "@linktree/types";

/** Missing collection totals cannot be substituted with the current page size. */
export function readFormMetrics(input: unknown): FormMetrics {
  if (!input || typeof input !== "object") throw new Error("Invalid form metrics");
  const data = input as Record<string, unknown>;
  for (const key of ["views", "visitors", "starts", "submissions", "totalForms"] as const) {
    if (key === "totalForms" && data[key] === undefined) continue;
    if (typeof data[key] !== "number" || !Number.isSafeInteger(data[key]) || data[key] < 0) {
      throw new Error("Invalid form metrics");
    }
  }
  return input as FormMetrics;
}
