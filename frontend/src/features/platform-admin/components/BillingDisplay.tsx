"use client";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import type { PlatformLocale } from "../i18n/locale";
import { billingText } from "./use-billing-text";
import type { PlanStatus, SubscriptionStatus } from "./billing-types";
export const planStatusOptions: Array<{ value: PlanStatus; label: string }> = [
  { value: "active", label: "چالاک" },
  { value: "inactive", label: "ناچالاک" },
  { value: "archived", label: "ئەرشیفکراو" },
];

export const subscriptionStatusOptions: Array<{
  value: SubscriptionStatus;
  label: string;
}> = [
  { value: "active", label: "چالاک" },
  { value: "trialing", label: "تاقیکردنەوە" },
  { value: "grace_period", label: "ماوەی ڕێگەپێدان" },
  { value: "past_due", label: "پارەدان دواکەوتووە" },
  { value: "paused", label: "ڕاگیراو" },
  { value: "incomplete", label: "ناتەواو" },
  { value: "canceled", label: "هەڵوەشێنراوەتەوە" },
  { value: "expired", label: "بەسەرچووە" },
];

function planStatusLabel(status: PlanStatus, locale: PlatformLocale) {
  return billingText(
    planStatusOptions.find((option) => option.value === status)?.label ||
      status,
    locale,
  );
}

function subscriptionStatusLabel(
  status: SubscriptionStatus | undefined,
  locale: PlatformLocale,
) {
  if (!status) return billingText("دیاری نەکراوە", locale);
  return billingText(
    subscriptionStatusOptions.find((option) => option.value === status)
      ?.label || status,
    locale,
  );
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

export function formatDate(
  value: string | null | undefined,
  locale: PlatformLocale = "ckb",
) {
  if (!value) return billingText("دیاری نەکراوە", locale);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? billingText("دیاری نەکراوە", locale)
    : date.toLocaleString(
        locale === "ar" ? "ar-IQ" : locale === "en" ? "en-IQ" : "ckb-IQ",
      );
}

export function StatusBadge({
  status,
  type,
}: {
  status: PlanStatus | SubscriptionStatus | "unassigned";
  type: "plan" | "subscription";
}) {
  const { locale } = usePlatformLocale();
  const critical = ["past_due", "expired", "incomplete", "archived"].includes(
    status,
  );
  const warning = ["trialing", "grace_period", "paused", "inactive"].includes(
    status,
  );
  const label =
    status === "unassigned"
      ? billingText("پلان دیاری نەکراوە", locale)
      : type === "plan"
        ? planStatusLabel(status as PlanStatus, locale)
        : subscriptionStatusLabel(status as SubscriptionStatus, locale);
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${
        status === "unassigned"
          ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5"
          : critical
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            : warning
              ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      }`}
    >
      {label}
    </span>
  );
}
