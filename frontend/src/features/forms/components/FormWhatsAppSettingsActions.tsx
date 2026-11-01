import { RotateCcw } from "lucide-react";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { formsCopy } from "../forms-copy";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";
import type { FormLanguage } from "../types";

export function FormWhatsAppSettingsActions({
  locale,
  saving,
  valid,
  onRestore,
  onSave,
}: {
  locale: FormLanguage;
  saving: boolean;
  valid: boolean;
  onRestore: () => void;
  onSave: () => void;
}) {
  const copy = formWhatsAppSettingsCopy(locale),
    common = formsCopy(locale);
  return (
    <div
      role="group"
      aria-label={copy.actions}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <SettingsActionButton
        label={copy.restoreDefaults}
        icon={RotateCcw}
        variant="soft"
        accentMode="tenant"
        disabled={saving}
        onClick={onRestore}
      />
      <SettingsActionButton
        label={saving ? common.saving : common.save}
        accentMode="tenant"
        disabled={!valid}
        busy={saving}
        onClick={onSave}
      />
    </div>
  );
}
