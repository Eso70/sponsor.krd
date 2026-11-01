"use client";

import { useState } from "react";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { useFormWhatsAppTemplates } from "../use-form-whatsapp-templates";
import { formsCopy } from "../forms-copy";
import { FormWhatsAppSettings } from "./FormWhatsAppSettings";
import type { FormsScope } from "../api";
import type { FormLanguage } from "../types";

/** Shared settings body and refresh lifecycle for Business and Platform. */
export function FormWhatsAppSettingsPage({
  scope,
  locale,
}: {
  scope: FormsScope;
  locale: FormLanguage;
}) {
  const settings = useFormWhatsAppTemplates(scope);
  const [revision, setRevision] = useState(0);
  const refreshing = useRegisterDashboardRefresh(
    `form-whatsapp-settings-${scope}`,
    async () => {
      if (settings.saving) return;
      await settings.load();
      setRevision((value) => value + 1);
    },
  );
  return (
    <DashboardRefreshRegion
      loading={refreshing}
      label={formsCopy(locale).loading}
    >
      <FormWhatsAppSettings
        key={`${scope}-${revision}`}
        settings={settings}
        locale={locale}
      />
    </DashboardRefreshRegion>
  );
}
