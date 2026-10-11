import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import {
  billingAmount,
  subscriptionCopy,
  type BillingCycle,
  type BillingLocale,
} from "../copy";

export interface PlanCardData {
  code: string;
  name: string;
  currency: string;
  monthlyPriceMinor?: number | null;
  yearlyPriceMinor?: number | null;
  entitlements?: Record<string, unknown>;
  templateCount?: number;
}

/** One plan comparison presentation for business and platform management. */
export function SubscriptionPlanCard({
  plan,
  cycle,
  locale,
  current = false,
  children,
}: {
  plan: PlanCardData;
  cycle: BillingCycle;
  locale: BillingLocale;
  current?: boolean;
  children?: ReactNode;
}) {
  const copy = subscriptionCopy[locale];
  const values = plan.entitlements ?? {};
  const counts = [
    [copy.pages, values["limit.linktrees"]],
    [copy.pixels, values["limit.tiktok_pixels"]],
    [copy.changes, values["limit.profile_changes_monthly"]],
    [copy.templates, plan.templateCount],
  ] as const;
  const features = [
    [copy.tiktok, "feature.tiktok"],
    [copy.branding, "feature.remove_branding"],
    [copy.advertising, "feature.advertising_page"],
  ] as const;
  return (
    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-5 ${
        current
          ? "border-sky-400 bg-sky-50/40 dark:border-sky-400/60 dark:bg-sky-400/5"
          : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#161B22]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-lg font-bold text-slate-800 dark:text-slate-100">
          {plan.name}
        </h3>
        {current && (
          <span className="shrink-0 rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            {copy.current}
          </span>
        )}
      </div>
      <p className="my-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {billingAmount(
          cycle === "monthly" ? plan.monthlyPriceMinor : plan.yearlyPriceMinor,
          plan.currency,
          locale,
        )}
        <span className="ms-1 text-xs font-normal tracking-normal text-slate-500">
          / {cycle === "monthly" ? copy.month : copy.year}
        </span>
      </p>
      <dl className="space-y-2 border-t border-slate-100 pt-4 text-xs dark:border-white/10">
        {counts.map(
          ([label, value]) =>
            typeof value === "number" && (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="font-semibold text-slate-700 dark:text-slate-200">
                  {value === -1 ? copy.unlimited : value}
                </dd>
              </div>
            ),
        )}
      </dl>
      <ul className="my-4 space-y-2 text-xs">
        {features.map(
          ([label, key]) =>
            key in values && (
              <li
                key={key}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
              >
                {values[key] === true ? (
                  <Check
                    className="size-4 shrink-0 text-emerald-500"
                    aria-label={copy.included}
                  />
                ) : (
                  <Minus
                    className="size-4 shrink-0 text-slate-400"
                    aria-label={copy.excluded}
                  />
                )}
                {label}
              </li>
            ),
        )}
      </ul>
      {children && (
        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-white/10">
          {children}
        </div>
      )}
    </article>
  );
}
