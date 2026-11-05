"use client";

import { useEffect } from "react";
import { Megaphone } from "lucide-react";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { campaignCopy } from "../campaign-copy";

export function PlatformTikTokAdAccountTab() {
  const { locale } = usePlatformLocale();
  const copy = campaignCopy[locale];
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const key of ["auth_code", "connected", "adv_id", "adv_name", "state", "error", "error_description"])
      url.searchParams.delete(key);
    if (url.href !== window.location.href)
      window.history.replaceState({}, "", url.href);
    // Retire browser-persisted credentials from the former connector.
    try { localStorage.removeItem("platform_tiktok_ad_account"); }
    catch { console.warn("Could not remove retired TikTok Ads browser settings"); }
  }, []);
  return (
    <DashboardSurface>
      <EmptyState icon={Megaphone} title={copy.connectionUnavailable}
        description={copy.connectionDescription} />
    </DashboardSurface>
  );
}
