import type { FormsCopy } from "./forms-copy";

export function formAnswerText(value: string) {
  try {
    const data: unknown = JSON.parse(value);
    if (Array.isArray(data) && data.every((part) => typeof part === "string"))
      return data.filter(Boolean).join(" › ");
  } catch {
    /* Plain text answer. */
  }
  return value;
}
export function completionTime(
  duration: number | null | undefined,
  copy: FormsCopy,
) {
  if (duration == null || !Number.isFinite(duration) || duration < 0) return "—";
  const seconds = Math.round(duration / 1000);
  return seconds < 60
    ? `${seconds} ${copy.seconds}`
    : `${Math.floor(seconds / 60)} ${copy.minutes} ${seconds % 60} ${copy.seconds}`;
}

export function formCompletionRate(
  completion?: import("@linktree/types").FormCompletionPeriod,
) {
  const rate = completion?.rate;
  return rate != null && Number.isFinite(rate) && rate >= 0 && rate <= 100 ? `${rate.toFixed(1)}%` : "—";
}
