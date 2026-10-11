"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { EditorField } from "@/components/shared/EditorField";
import { CheckboxField } from "@/components/shared/CheckboxField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { apiRequest } from "@/lib/api/request";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { getPermissionDescription } from "./access-control/permission-descriptions";
import { subscriptionCopy } from "@/features/billing/copy";
import type { SubscriptionPlan, CatalogEntitlement } from "./billing-types";
interface CatalogPermission {
  id: string;
  key: string;
  supportsApproval: boolean;
}
interface PlanPolicy {
  entitlements: Record<string, boolean | number | string>;
  permissions: Record<
    string,
    { accessMode: "direct" | "approval" | "deny"; [key: string]: unknown }
  >;
  templateKeys: string[];
}

export function PlanPolicyEditorModal({
  plan,
  profileCode,
  entitlements,
  onClose,
  onSaved,
}: {
  plan: SubscriptionPlan;
  profileCode: string;
  entitlements: CatalogEntitlement[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = usePlatformLocale();
  const copy = subscriptionCopy[locale];
  const labels =
    locale === "ckb"
      ? {
          title: "مۆڵەت و سنوورەکان",
          direct: "ڕاستەوخۆ",
          approval: "پێویستی بە پەسەندکردنە",
          deny: "ڕێگەپێنەدراو",
          hint: "گۆڕانکارییەکان بۆ هەموو بەشداربووانی ئەم پڕۆفایلە جێبەجێ دەبن.",
        }
      : locale === "ar"
        ? {
            title: "الصلاحيات والحدود",
            direct: "مباشر",
            approval: "يتطلب موافقة",
            deny: "غير مسموح",
            hint: "تُطبّق التغييرات على جميع المشتركين بهذا الملف.",
          }
        : {
            title: "Permissions & limits",
            direct: "Allowed",
            approval: "Requires approval",
            deny: "Not allowed",
            hint: "Changes apply to every subscriber using this permission profile.",
          };
  const [policy, setPolicy] = useState<PlanPolicy | null>(null);
  const [permissions, setPermissions] = useState<CatalogPermission[]>([]);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest<PlanPolicy>(
        `/api/platform/billing/plans/${plan.permissionProfileId}/configuration`,
        { signal: controller.signal },
      ),
      apiRequest<CatalogPermission[]>("/api/platform/permissions/catalog", {
        signal: controller.signal,
      }),
    ])
      .then(([configuration, catalog]) => {
        if (!controller.signal.aborted) {
          setPolicy(configuration);
          setPermissions(catalog);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [plan.permissionProfileId]);
  const activeEntitlements = entitlements.filter(
    (item) => item.status === "active",
  );
  const valid =
    !!policy &&
    activeEntitlements.every(
      (item) =>
        item.valueType !== "integer" ||
        (Number.isSafeInteger(policy.entitlements[item.id] ?? 0) &&
          Number(policy.entitlements[item.id] ?? 0) >= -1),
    );
  const save = async () => {
    if (!policy || !valid || saving) return;
    setSaving(true);
    try {
      await apiRequest(
        `/api/platform/billing/plans/${plan.permissionProfileId}/configuration`,
        {
          method: "PATCH",
          json: {
            templateKeys: policy.templateKeys,
            entitlements: Object.fromEntries(
              activeEntitlements.map((item) => [
                item.id,
                policy.entitlements[item.id] ??
                  (item.valueType === "boolean"
                    ? false
                    : item.valueType === "integer"
                      ? 0
                      : ""),
              ]),
            ),
            permissions: Object.fromEntries(
              permissions.map((item) => [
                item.id,
                policy.permissions[item.id] ?? { accessMode: "deny" },
              ]),
            ),
          },
        },
      );
      onSaved();
    } catch {
      toast.error(copy.error);
    } finally {
      setSaving(false);
    }
  };
  const updateValue = (id: string, value: boolean | number | string) =>
    setPolicy((previous) =>
      previous
        ? {
            ...previous,
            entitlements: { ...previous.entitlements, [id]: value },
          }
        : previous,
    );
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={`${plan.name} · ${labels.title}`}
      description={labels.hint}
      wide
      sponsorKrdTheme
      busy={saving}
      closeLabel={copy.close}
      footer={
        <ModalFooterActions
          submitLabel={
            locale === "ckb"
              ? "پاشەکەوتکردن"
              : locale === "ar"
                ? "حفظ التغييرات"
                : "Save changes"
          }
          submitDisabled={!valid || failed}
          isSubmitting={saving}
          submittingLabel={copy.saving}
          onCancel={onClose}
          cancelLabel={copy.close}
          onSubmit={() => void save()}
        />
      }
    >
      {failed ? (
        <p role="alert" className="text-sm text-red-500">
          {copy.error}
        </p>
      ) : !policy ? (
        <p role="status" className="animate-pulse text-sm text-slate-500">
          {labels.title}…
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {activeEntitlements.map((item) =>
              item.valueType === "boolean" ? (
                <CheckboxField
                  key={item.id}
                  compact
                  label={item.name}
                  checked={policy.entitlements[item.id] === true}
                  onChange={(value) => updateValue(item.id, value)}
                />
              ) : (
                <EditorField
                  key={item.id}
                  label={item.name}
                  hint={
                    item.valueType === "integer"
                      ? `-1 = ${copy.unlimited}`
                      : undefined
                  }
                >
                  <ModalTextInput
                    type={item.valueType === "integer" ? "number" : "text"}
                    min={item.valueType === "integer" ? -1 : undefined}
                    step={item.valueType === "integer" ? 1 : undefined}
                    maxLength={500}
                    value={String(
                      policy.entitlements[item.id] ??
                        (item.valueType === "integer" ? 0 : ""),
                    )}
                    onChange={(event) =>
                      updateValue(
                        item.id,
                        item.valueType === "integer"
                          ? Number(event.target.value)
                          : event.target.value,
                      )
                    }
                  />
                </EditorField>
              ),
            )}
          </div>
          <section>
            <h3 className="mb-3 text-sm font-bold">{copy.templates}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEMPLATE_OPTIONS.map((template) => (
                <CheckboxField
                  key={template.id}
                  compact
                  label={template.name}
                  disabled={
                    template.id === "branch-signal" &&
                    !["ultra", "max"].includes(profileCode)
                  }
                  checked={policy.templateKeys.includes(template.id)}
                  onChange={(checked) =>
                    setPolicy({
                      ...policy,
                      templateKeys: checked
                        ? [...policy.templateKeys, template.id]
                        : policy.templateKeys.filter(
                            (key) => key !== template.id,
                          ),
                    })
                  }
                />
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-bold">{copy.permissions}</h3>
            {permissions.map((item) => (
              <CustomSelect
                key={item.id}
                label={getPermissionDescription(item.key, locale)}
                value={policy.permissions[item.id]?.accessMode ?? "deny"}
                options={[
                  { value: "direct", label: labels.direct },
                  ...(item.supportsApproval
                    ? [{ value: "approval", label: labels.approval }]
                    : []),
                  { value: "deny", label: labels.deny },
                ]}
                onChange={(value) =>
                  setPolicy({
                    ...policy,
                    permissions: {
                      ...policy.permissions,
                      [item.id]: {
                        ...policy.permissions[item.id],
                        accessMode: value as "direct" | "approval" | "deny",
                      },
                    },
                  })
                }
              />
            ))}
          </section>
        </div>
      )}
    </ManagementModal>
  );
}
