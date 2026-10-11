"use client";

import { useEffect, useState } from "react";
import { ManagementModal } from "@/components/shared/ManagementModal";
import {
  subscriptionCopy,
  subscriptionStatusText,
  type BillingCycle,
  type BillingLocale,
} from "../copy";
import {
  getCustomerSubscription,
  type CustomerSubscriptionOverview,
} from "../api";
import { SubscriptionPlanCard } from "./SubscriptionPlanCard";

export function BusinessSubscriptionModal({
  isOpen,
  onClose,
  onSupport,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSupport: () => void;
  locale: BillingLocale;
}) {
  const copy = subscriptionCopy[locale];
  const [overview, setOverview] = useState<CustomerSubscriptionOverview | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    getCustomerSubscription(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setOverview(data);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [isOpen, attempt]);
  const access = overview?.access;
  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      extraWide
      closeLabel={copy.close}
    >
      <div className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300"
          >
            {copy.error}{" "}
            <button
              type="button"
              className="ms-2 cursor-pointer underline"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {copy.retry}
            </button>
          </div>
        ) : !overview ? (
          <p role="status" className="animate-pulse text-sm text-slate-500">
            {copy.title}…
          </p>
        ) : (
          <>
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-white/10 dark:bg-white/5 sm:grid-cols-3">
              <div>
                <p className="text-slate-500">{copy.current}</p>
                <p className="mt-1 font-bold">
                  {access?.subscription.planName || "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{copy.status}</p>
                <p className="mt-1 font-bold">
                  {subscriptionStatusText(access?.subscription.status, locale)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{copy.renews}</p>
                <p className="mt-1 font-bold">
                  {access?.subscription.currentPeriodEnd
                    ? new Intl.DateTimeFormat(
                        locale === "ckb" ? "en" : locale,
                        { dateStyle: "medium" },
                      ).format(new Date(access.subscription.currentPeriodEnd))
                    : copy.noEnd}
                </p>
              </div>
            </div>
            <div
              className="flex justify-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5"
              role="group"
              aria-label={copy.price}
            >
              {(["monthly", "yearly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cycle === value}
                  onClick={() => setCycle(value)}
                  className={`cursor-pointer rounded-lg px-5 py-2 text-xs font-semibold ${cycle === value ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {copy[value]}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overview.plans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  cycle={cycle}
                  locale={locale}
                  current={plan.id === access?.subscription.planId}
                />
              ))}
            </div>
            <section className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <h3 className="mb-3 text-sm font-bold">{copy.usage}</h3>
              <dl className="grid gap-3 text-xs sm:grid-cols-3">
                {(
                  [
                    ["limit.linktrees", copy.pages],
                    ["limit.tiktok_pixels", copy.pixels],
                    ["limit.profile_changes_monthly", copy.changes],
                  ] as const
                ).map(([key, label]) => {
                  const usage = access?.usage[key];
                  return (
                    usage && (
                      <div key={key}>
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-1 font-semibold">
                          {usage.used} /{" "}
                          {usage.limit === -1 ? copy.unlimited : usage.limit}
                        </dd>
                      </div>
                    )
                  );
                })}
              </dl>
            </section>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {copy.paymentSetup}
            </p>
            <button
              type="button"
              onClick={onSupport}
              className="theme-fill w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-[var(--theme-ink)]"
            >
              {copy.manage}
            </button>
          </>
        )}
      </div>
    </ManagementModal>
  );
}
