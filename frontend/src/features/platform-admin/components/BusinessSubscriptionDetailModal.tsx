"use client";
import { Building2 } from "lucide-react";
import { DetailViewModal } from "@/components/shared/DetailViewModal";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { useBillingText } from "./use-billing-text";
import { formatDate, StatusBadge } from "./BillingDisplay";
import type { BusinessRow } from "./billing-types";
import { subscriptionCopy } from "@/features/billing/copy";
export function BusinessSubscriptionDetailModal({
  business,
  onClose,
  onManage,
}: {
  business: BusinessRow | null;
  onClose: () => void;
  onManage: () => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  const subscription = business?.subscription;
  return (
    <DetailViewModal
      isOpen={!!business}
      onClose={onClose}
      title={business?.name || ""}
      subtitle={business ? `@${business.username}` : ""}
      icon={Building2}
      iconClassName="sa-soft sa-soft-border"
      footer={
        <button
          type="button"
          onClick={onManage}
          className="theme-fill w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-[var(--theme-ink)]"
        >
          {subscriptionCopy[locale].manage}
        </button>
      }
      fields={
        business
          ? [
              {
                label: t("پلانی دیاریکراو"),
                value: subscription?.planName || t("دیاری نەکراوە"),
              },
              {
                label: t("پڕۆفایلی مۆڵەت"),
                value:
                  subscription?.permissionProfileName || t("دیاری نەکراوە"),
              },
              {
                label: t("دۆخی بەشداربوون"),
                value: subscription ? (
                  <StatusBadge
                    status={subscription.status}
                    type="subscription"
                  />
                ) : (
                  t("دیاری نەکراوە")
                ),
              },
              {
                label: t("دەستپێکی ماوە"),
                value: formatDate(subscription?.currentPeriodStart, locale),
              },
              {
                label: t("کۆتایی ماوە"),
                value: formatDate(subscription?.currentPeriodEnd, locale),
              },
              {
                label: t("دواین نوێکردنەوە"),
                value: formatDate(subscription?.updatedAt, locale),
              },
            ]
          : []
      }
    />
  );
}
