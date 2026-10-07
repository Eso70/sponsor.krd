import type { AvailabilityStatus } from "./use-subdomain-availability";
import { subdomainCopy } from "./copy";

export function SubdomainAvailabilityMessage({ status, locale }: {
  status: AvailabilityStatus;
  locale: keyof typeof subdomainCopy;
}) {
  if (status === "idle") return null;
  return <span role="status" aria-live="polite" className={`mt-2 block text-xs ${status === "available" ? "text-emerald-600 dark:text-emerald-400" : status === "checking" ? "text-slate-500" : "text-rose-600 dark:text-rose-400"}`}>{subdomainCopy[locale][status]}</span>;
}
