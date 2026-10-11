"use client";
import { CreditCard } from "lucide-react";
import { DetailViewModal } from "@/components/shared/DetailViewModal";
import { useBillingText } from "./use-billing-text";
import { formatMoney, StatusBadge } from "./BillingDisplay";
import type { SubscriptionPlan } from "./billing-types";
export function PlanDetailModal({
  plan,
  onClose,
}: {
  plan: SubscriptionPlan | null;
  onClose: () => void;
}) {
  const t = useBillingText();
  return (
    <DetailViewModal
      isOpen={!!plan}
      onClose={onClose}
      title={plan?.name || ""}
      subtitle={t("وردەکاری پلانی بەشداربوون")}
      icon={CreditCard}
      iconClassName="sa-soft sa-soft-border"
      fields={
        plan
          ? [
              {
                label: t("دۆخ"),
                value: <StatusBadge status={plan.status} type="plan" />,
              },
              {
                label: t("پڕۆفایلی مۆڵەت"),
                value: plan.permissionProfileName,
              },
              {
                label: t("نرخی ساڵانە"),
                value: formatMoney(plan.yearlyPriceMinor, plan.currency),
              },
              {
                label: t("ماوەی تاقیکردنەوە"),
                value: plan.trialDays
                  ? `${plan.trialDays} ${t("ڕۆژ")}`
                  : t("نییە"),
              },
              {
                label: t("بەشداربووان"),
                value: String(plan.subscriberCount),
              },
              {
                label: t("پلانی بنەڕەتی"),
                value: plan.isDefault ? t("بەڵێ") : t("نەخێر"),
              },
              {
                label: t("ڕیزبەندی"),
                value: String(plan.displayOrder),
              },
              {
                label: t("ڕوونکردنەوە"),
                value: plan.description || t("ڕوونکردنەوە نییە"),
                fullWidth: true,
              },
            ]
          : []
      }
    />
  );
}
