"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { EditorField } from "@/components/shared/EditorField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { modalTextareaClass } from "@/components/shared/modal-input-styles";
import { apiRequest } from "@/lib/api/request";
import { subscriptionCopy } from "@/features/billing/copy";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { useBillingText } from "./use-billing-text";
import type {
  PermissionProfile,
  SubscriptionPlan,
  PlanStatus,
} from "./billing-types";

export function PlanFormModal({
  plan,
  plans,
  permissionProfiles,
  onClose,
  onSaved,
}: {
  plan?: SubscriptionPlan;
  plans: SubscriptionPlan[];
  permissionProfiles: PermissionProfile[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = usePlatformLocale();
  const copy = subscriptionCopy[locale];
  const t = useBillingText();
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [profile, setProfile] = useState(
    plan?.permissionProfileId ?? permissionProfiles[0]?.id ?? "",
  );
  const [currency, setCurrency] = useState(plan?.currency ?? "USD");
  const [monthly, setMonthly] = useState(
    String((plan?.monthlyPriceMinor ?? 0) / 100),
  );
  const [yearly, setYearly] = useState(
    String((plan?.yearlyPriceMinor ?? 0) / 100),
  );
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? "active");
  const [trial, setTrial] = useState(String(plan?.trialDays ?? 0));
  const [order, setOrder] = useState(String(plan?.displayOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const duplicate = plans.some(
    (item) =>
      item.id !== plan?.id &&
      item.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  const validPrice = (value: string) =>
    value.trim() !== "" &&
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number.isSafeInteger(Math.round(Number(value) * 100));
  const canSave =
    name.trim().length >= 2 &&
    name.trim().length <= 120 &&
    !duplicate &&
    !!profile &&
    validPrice(monthly) &&
    validPrice(yearly) &&
    Number.isInteger(Number(trial)) &&
    Number(trial) >= 0 &&
    Number(trial) <= 365 &&
    Number.isInteger(Number(order)) &&
    Number(order) >= -32768 &&
    Number(order) <= 32767;
  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await apiRequest(
        plan
          ? `/api/platform/billing/subscription-plans/${plan.id}`
          : "/api/platform/billing/subscription-plans",
        {
          method: plan ? "PATCH" : "POST",
          json: {
            name: name.trim(),
            description: description.trim(),
            permissionProfileId: profile,
            currency,
            monthlyPriceMinor: Math.round(Number(monthly) * 100),
            yearlyPriceMinor: Math.round(Number(yearly) * 100),
            status,
            trialDays: Number(trial),
            displayOrder: Number(order),
          },
        },
      );
      toast.success(t(plan ? "پلان نوێکرایەوە" : "پلانی نوێ دروستکرا"));
      onSaved();
    } catch {
      toast.error(t("پاشەکەوتکردنی پلان سەرکەوتوو نەبوو"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={t(plan ? "دەستکاریکردنی پلان" : "پلانی بەشداربوونی نوێ")}
      description={t("زانیاری نرخ و پڕۆفایلی مۆڵەتی پلان دیاری بکە.")}
      sponsorKrdTheme
      busy={saving}
      closeLabel={t("داخستن")}
      footer={
        <ModalFooterActions
          submitLabel={t(plan ? "نوێکردنەوە" : "دروستکردن")}
          submitDisabled={!canSave}
          isSubmitting={saving}
          submittingLabel={copy.saving}
          cancelLabel={t("هەڵوەشاندنەوە")}
          onCancel={onClose}
          onSubmit={() => void save()}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label={t("ناوی پلان")} required>
          <ModalTextInput
            autoFocus
            value={name}
            maxLength={120}
            hasError={duplicate}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("ناوی پلان")}
          />
        </EditorField>
        <CustomSelect
          label={copy.permissions}
          value={profile}
          options={permissionProfiles.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          onChange={setProfile}
        />
        <EditorField label={t("ڕوونکردنەوە")} className="sm:col-span-2">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            className={modalTextareaClass(false, "min-h-20")}
          />
        </EditorField>
        <EditorField label={`${copy.price} · ${copy.monthly}`} required>
          <ModalTextInput
            type="number"
            min="0"
            step="0.01"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
          />
        </EditorField>
        <EditorField label={`${copy.price} · ${copy.yearly}`} required>
          <ModalTextInput
            type="number"
            min="0"
            step="0.01"
            value={yearly}
            onChange={(event) => setYearly(event.target.value)}
          />
        </EditorField>
        <CustomSelect
          label={t("دراو")}
          value={currency}
          options={[
            { value: "USD", label: "USD" },
            { value: "IQD", label: "IQD" },
          ]}
          onChange={setCurrency}
        />
        <CustomSelect
          label={t("دۆخ")}
          value={status}
          onChange={(value) => setStatus(value as PlanStatus)}
          disabled={plan?.isDefault}
          options={[
            { value: "active", label: t("چالاک") },
            { value: "inactive", label: t("ناچالاک") },
            { value: "archived", label: t("ئەرشیفکراو") },
          ]}
        />
        <EditorField label={t("تاقیکردنەوە")}>
          <ModalTextInput
            type="number"
            min="0"
            max="365"
            step="1"
            value={trial}
            onChange={(event) => setTrial(event.target.value)}
          />
        </EditorField>
        <EditorField label={t("ڕیزبەندی پلان")}>
          <ModalTextInput
            type="number"
            min="-32768"
            max="32767"
            step="1"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </EditorField>
      </div>
    </ManagementModal>
  );
}
