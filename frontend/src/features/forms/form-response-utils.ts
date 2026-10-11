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
  if (duration == null) return "—";
  const seconds = Math.round(duration / 1000);
  return seconds < 60
    ? `${seconds} ${copy.seconds}`
    : `${Math.floor(seconds / 60)} ${copy.minutes} ${seconds % 60} ${copy.seconds}`;
}

export function formCompletionRate(
  completion?: import("@linktree/types").FormCompletionPeriod,
) {
  return completion?.rate != null ? `${completion.rate.toFixed(1)}%` : "—";
}
