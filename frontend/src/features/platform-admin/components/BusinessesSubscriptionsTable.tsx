"use client";
import { Building2, Eye } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tooltip } from "@/components/shared/Tooltip";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { useBillingText } from "./use-billing-text";
import { formatDate, StatusBadge } from "./BillingDisplay";
import type { BusinessRow } from "./billing-types";
export function BusinessesSubscriptionsTable({
  businesses,
  onView,
}: {
  businesses: BusinessRow[];
  onView: (business: BusinessRow) => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  if (!businesses.length) {
    return (
      <EmptyState
        icon={Building2}
        title={t("هیچ بزنسێک نەدۆزرایەوە")}
        description={t("فلتەرەکان بگۆڕە یان ناوێکی تر بگەڕێ.")}
      />
    );
  }
  return (
    <div className="overflow-x-auto custom-scrollbar brand-custom-scrollbar">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
            {[
              "بزنس",
              "پلانی دیاریکراو",
              "پڕۆفایلی مۆڵەت",
              "کۆتایی ماوە",
              "دۆخ",
              "کارەکان",
            ].map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr
              key={business.id}
              className="border-b border-slate-100 text-slate-600 transition hover:bg-slate-50/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/[0.03]"
            >
              <td className="px-3 py-3">
                <p className="font-bold">{business.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  @{business.username}
                </p>
              </td>
              <td className="px-3 py-3 font-bold">
                {business.subscription?.planName || t("دیاری نەکراوە")}
              </td>
              <td className="px-3 py-3">
                {business.subscription?.permissionProfileName || "—"}
              </td>
              <td className="px-3 py-3">
                {formatDate(business.subscription?.currentPeriodEnd, locale)}
              </td>
              <td className="px-3 py-3">
                <StatusBadge
                  status={business.subscription?.status || "unassigned"}
                  type="subscription"
                />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <Tooltip content={t("بینین")} side="top">
                    <button
                      type="button"
                      onClick={() => onView(business)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer"
                      title={t("بینین")}
                      aria-label={t("بینینی بەشداری")}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
