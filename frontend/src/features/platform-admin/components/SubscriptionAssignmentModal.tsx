"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { CheckboxField } from "@/components/shared/CheckboxField";
import { apiRequest } from "@/lib/api/request";
import { subscriptionCopy } from "@/features/billing/copy";
import { subscriptionStatusOptions } from "./BillingDisplay";
import { useBillingText } from "./use-billing-text";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import type {
  BusinessRow,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./billing-types";

function localDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function SubscriptionAssignmentModal({
  business,
  plans,
  onClose,
  onSaved,
}: {
  business: BusinessRow;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useBillingText();
  const { locale } = usePlatformLocale();
  const copy = subscriptionCopy[locale];
  const current = business.subscription;
  const [planId, setPlanId] = useState(current?.planId ?? "");
  const [status, setStatus] = useState<SubscriptionStatus>(
    current?.status ?? "active",
  );
  const [cycle, setCycle] = useState(current?.billingCycle ?? "custom");
  const [start, setStart] = useState(
    localDateTime(current?.currentPeriodStart ?? new Date().toISOString()),
  );
  const [end, setEnd] = useState(localDateTime(current?.currentPeriodEnd));
  const [cancel, setCancel] = useState(!!current?.cancelsAt);
  const [saving, setSaving] = useState(false);
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : null;
  const valid =
    !!planId &&
    Number.isFinite(startTime) &&
    (endTime === null || (Number.isFinite(endTime) && endTime > startTime)) &&
    (!cancel || endTime !== null);
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await apiRequest("/api/platform/billing/subscriptions", {
        method: "POST",
        json: {
          businessId: business.id,
          subscriptionPlanId: planId,
          status,
          billingCycle: cycle,
          currentPeriodStart: new Date(startTime).toISOString(),
          currentPeriodEnd:
            endTime === null ? null : new Date(endTime).toISOString(),
          cancelAtPeriodEnd: cancel,
        },
      });
      onSaved();
    } catch {
      toast.error(copy.error);
    } finally {
      setSaving(false);
    }
  };
  const cancelLabel =
    locale === "ckb"
      ? "لە کۆتایی ماوەدا هەڵوەشێنەوە"
      : locale === "ar"
        ? "إلغاء في نهاية الفترة"
        : "Cancel at period end";
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={`${business.name} · ${copy.manage}`}
      busy={saving}
      description={
        locale === "ckb"
          ? "گۆڕانکارییەکان دەستبەجێ جێبەجێ دەبن و تۆمار دەکرێن."
          : locale === "ar"
            ? "تُطبّق التغييرات فورًا وتُسجّل للمراجعة."
            : "Changes take effect immediately and are recorded in the audit log."
      }
      sponsorKrdTheme
      closeLabel={copy.close}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onSubmit={() => void save()}
          submitDisabled={!valid}
          isSubmitting={saving}
          submittingLabel={copy.saving}
          cancelLabel={copy.close}
          submitLabel={t("نوێکردنەوە")}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <CustomSelect
          label={copy.current}
          value={planId}
          onChange={setPlanId}
          options={plans
            .filter(
              (plan) => plan.status === "active" || plan.id === current?.planId,
            )
            .map((plan) => ({ value: plan.id, label: plan.name }))}
        />
        <CustomSelect
          label={copy.status}
          value={status}
          onChange={(value) => setStatus(value as SubscriptionStatus)}
          options={subscriptionStatusOptions.map((option) => ({
            ...option,
            label: t(option.label),
          }))}
        />
        <CustomSelect
          label={copy.price}
          value={cycle}
          onChange={(value) => setCycle(value as typeof cycle)}
          options={[
            { value: "monthly", label: copy.monthly },
            { value: "yearly", label: copy.yearly },
            {
              value: "custom",
              label:
                locale === "ckb"
                  ? "تایبەت"
                  : locale === "ar"
                    ? "مخصص"
                    : "Custom",
            },
            {
              value: "free",
              label:
                locale === "ckb"
                  ? "بەخۆڕایی"
                  : locale === "ar"
                    ? "مجاني"
                    : "Free",
            },
          ]}
        />
        <EditorField label={t("دەستپێکی ماوە")} required>
          <ModalTextInput
            type="datetime-local"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </EditorField>
        <EditorField label={t("کۆتایی ماوە")} hint={copy.noEnd}>
          <ModalTextInput
            type="datetime-local"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </EditorField>
        <CheckboxField
          label={cancelLabel}
          checked={cancel}
          onChange={setCancel}
        />
      </div>
    </ManagementModal>
  );
}
