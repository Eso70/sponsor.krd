"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, KeyRound, LockKeyhole, Radar, Send } from "lucide-react";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { readTikTokSummary } from "../tiktok-summary";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import type { EffectiveAccessManifest } from "@linktree/types";
import { LockedNotice } from "@/components/shared/LockedContent";
import { StatCard } from "@/components/shared/StatCard";
import { SkeletonTikTokPage } from "@/components/shared/SkeletonPageLayouts";
import { Tooltip } from "@/components/shared/Tooltip";
import { BusinessTikTokDeliveryPage } from "./BusinessTikTokDeliveryPage";
import { BusinessTikTokPixelConfigPage, type TikTokPixelConfigCopy } from "./BusinessTikTokPixelConfigPage";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { useTranslations } from "next-intl";

interface TrackingSummary {
  delivered: number;
  deliveryRate: number;
}

function canReadDelivery(access: EffectiveAccessManifest | null): boolean {
  const planCode = access?.subscription?.planCode?.toLowerCase();
  return (
    planCode !== "basic" &&
    planCode !== "pro" &&
    access?.permissions["business:analytics:tiktok-health-read"]?.outcome ===
      "allow"
  );
}

function configCounts(settings: unknown): {
  configuredPixels: number;
  apiConnections: number;
} {
  const data =
    settings && typeof settings === "object"
      ? (settings as Record<string, unknown>)
      : {};
  const configs = Array.isArray(data.tiktok_configs) ? data.tiktok_configs : [];
  return {
    configuredPixels: configs.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).pixel_id === "string" &&
        Boolean(((item as Record<string, unknown>).pixel_id as string).trim()),
    ).length,
    apiConnections: configs.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).pixel_id === "string" &&
        Boolean(((item as Record<string, unknown>).pixel_id as string).trim()) &&
        Boolean(
          (item as Record<string, unknown>).has_events_token ||
          (item as Record<string, unknown>).token_last_four,
        ),
    ).length,
  };
}

export function BusinessTikTokConfigPage({ pixelCopy }: { pixelCopy?: Partial<TikTokPixelConfigCopy> }) {
  const startRequest = useLatestRequest();
  const startHealthRequest = useLatestRequest();
  const [settingsUnavailable, setSettingsUnavailable] = useState(false);
  const t = useTranslations("TikTokPage");
  const [access, setAccess] = useState<EffectiveAccessManifest | null>(null);
  const [configuredPixels, setConfiguredPixels] = useState(0);
  const [apiConnections, setApiConnections] = useState(0);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAccess = useCallback(
    async (next: EffectiveAccessManifest, rethrow = false) => {
      const current = startHealthRequest();
      setAccess(next);
      if (!canReadDelivery(next)) {
        setSummary(null);
        return;
      }
      try {
        const response = await fetch("/api/analytics/v2/tiktok/health", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load summary");
        const payload = await response.json();
        const summary = readTikTokSummary(payload.data);
        if (current()) setSummary(summary);
      } catch (error) {
        if (!current()) return;
        setSummary(null);
        if (rethrow) throw error;
      }
    },
    [startHealthRequest],
  );

  const loadTracking = useCallback(
    async (rethrow = false) => {
      const current = startRequest();
      try {
        const [accessResponse, settingsResponse] = await Promise.all([
          fetch("/api/auth/effective-access", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/auth/settings", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        if (!accessResponse.ok || !settingsResponse.ok) {
          throw new Error("Failed to load Event Tracking");
        }
        const [accessPayload, settingsPayload] = await Promise.all([
          accessResponse.json(),
          settingsResponse.json(),
        ]);
        if (!current()) return;
        setSettingsUnavailable(false);
        const counts = configCounts(settingsPayload.data);
        setConfiguredPixels(counts.configuredPixels);
        setApiConnections(counts.apiConnections);
        await applyAccess(accessPayload.data, rethrow);
      } catch (error) {
        if (!current()) return;
        setSettingsUnavailable(true);
        setSummary(null);
        if (rethrow) throw error;
      }
    },
    [applyAccess, startRequest],
  );

  const refreshing = useRegisterDashboardRefresh("tiktok-config", () =>
    loadTracking(true),
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadTracking().finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 0);

    const syncAccess = () => { void loadTracking(); };
    const syncSettings = () => { void loadTracking(); };
    window.addEventListener("sponsor-krd:access-updated", syncAccess);
    window.addEventListener(
      "sponsor-krd:business-settings-updated",
      syncSettings,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("sponsor-krd:access-updated", syncAccess);
      window.removeEventListener(
        "sponsor-krd:business-settings-updated",
        syncSettings,
      );
    };
  }, [applyAccess, loadTracking]);

  const deliveryAllowed = canReadDelivery(access);
  const lockedAction = (
    <Tooltip content={t("higherPlan")} side="top">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg cursor-default"
        style={{
          background: "color-mix(in srgb, var(--theme-primary) 12%, transparent)",
          color: "var(--theme-primary)",
        }}
      >
        <LockKeyhole className="h-3.5 w-3.5" />
      </span>
    </Tooltip>
  );

  return (
    <div
      dir="ltr"
      className="theme-custom-scrollbar selection:bg-brand-500/30 dark:selection:bg-brand-500/40"
    >
      <StatCardGrid columns={4} className="mb-8">
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={Radar}
          label={t("configuredPixels")}
          value={settingsUnavailable ? "—" : configuredPixels}
          color="blue"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={KeyRound}
          label={t("activeApi")}
          value={settingsUnavailable ? "—" : apiConnections}
          color="cyan"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={Send}
          label={t("delivered")}
          value={deliveryAllowed && summary ? summary.delivered : "—"}
          subtitle={access && !settingsUnavailable && !deliveryAllowed ? t("higherPlan") : undefined}
          color="green"
          action={access && !settingsUnavailable && !deliveryAllowed ? lockedAction : undefined}
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={t("loadingSettings")}
          icon={Activity}
          label={t("successRate")}
          value={deliveryAllowed && summary ? `${summary.deliveryRate.toFixed(1)}٪` : "—"}
          subtitle={access && !settingsUnavailable && !deliveryAllowed ? t("higherPlan") : undefined}
          color="pink"
          action={access && !settingsUnavailable && !deliveryAllowed ? lockedAction : undefined}
        />
      </StatCardGrid>

      {settingsUnavailable && <RequestErrorNotice message={t("loadFailed")} />}
      {loading ? <SkeletonTikTokPage showStats={false} loadingLabel={t("loadingSettings")} /> : settingsUnavailable ? null : <BusinessTikTokPixelConfigPage embedded copy={pixelCopy} managementTitle={t("configTab")} managementDescription={t("simpleDescription")}>
        <div className="mt-6">
        {deliveryAllowed ? (
          <BusinessTikTokDeliveryPage embedded />
        ) : (
          <LockedNotice
            compact
            className="max-w-none"
            title={t("lockedTitle")}
            description={t("lockedDescription")}
          />
        )}
        </div>
        </BusinessTikTokPixelConfigPage>}
    </div>
  );
}
