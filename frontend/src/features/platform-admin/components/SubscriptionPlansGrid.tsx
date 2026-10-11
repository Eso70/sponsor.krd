"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2, Layers3, ShieldCheck } from "lucide-react";
import { SubscriptionPlanCard } from "@/features/billing/components/SubscriptionPlanCard";
import { subscriptionCopy, type BillingCycle } from "@/features/billing/copy";
import { EmptyState } from "@/components/shared/EmptyState";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { useBillingText } from "./use-billing-text";
import type { SubscriptionPlan } from "./billing-types";

export function SubscriptionPlansGrid({
  plans,
  onView,
  onEdit,
  onDelete,
  onPolicy,
}: {
  plans: SubscriptionPlan[];
  onView: (plan: SubscriptionPlan) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  onPolicy: (plan: SubscriptionPlan) => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  const copy = subscriptionCopy[locale];
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  if (!plans.length)
    return (
      <EmptyState
        icon={Layers3}
        title={t("هیچ پلانێک نییە")}
        description={t("یەکەم پلانی بەشداربوون دروست بکە.")}
      />
    );
  return (
    <div className="space-y-4">
      <div
        className="flex justify-end gap-1"
        role="group"
        aria-label={copy.price}
      >
        {(["monthly", "yearly"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={cycle === value}
            onClick={() => setCycle(value)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold ${
              cycle === value
                ? "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {copy[value]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {plans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            locale={locale}
          >
            <div className="space-y-3 text-xs">
              <p className="truncate text-slate-500 dark:text-slate-400">
                {copy.permissions}: {plan.permissionProfileName}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">
                  {plan.subscriberCount} {t("بەشداربووان")}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {t(
                    plan.status === "active"
                      ? "چالاک"
                      : plan.status === "inactive"
                        ? "ناچالاک"
                        : "ئەرشیفکراو",
                  )}
                  {plan.isDefault ? ` · ${t("بنەڕەتی")}` : ""}
                </span>
              </div>
              <div className="flex justify-end gap-1">
                <IconActionButton
                  label={copy.permissions}
                  onClick={() => onPolicy(plan)}
                >
                  <ShieldCheck className="size-4" />
                </IconActionButton>
                <IconActionButton
                  label={t("بینینی پلان")}
                  onClick={() => onView(plan)}
                >
                  <Eye className="size-4" />
                </IconActionButton>
                <IconActionButton
                  label={t("دەستکاریکردنی پلان")}
                  onClick={() => onEdit(plan)}
                >
                  <Pencil className="size-4" />
                </IconActionButton>
                <IconActionButton
                  label={t("سڕینەوەی پلان")}
                  tone="danger"
                  disabled={plan.isDefault || plan.subscriberCount > 0}
                  onClick={() => onDelete(plan)}
                >
                  <Trash2 className="size-4" />
                </IconActionButton>
              </div>
            </div>
          </SubscriptionPlanCard>
        ))}
      </div>
    </div>
  );
}
