"use client";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleOff,
  KeyRound,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { EffectiveAccessManifest } from "@linktree/types";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonTikTokPixelConfig } from "@/components/shared/SkeletonPageLayouts";
import { TikTokPixelGroupCard, type TikTokPixelGroupCopy } from "@/features/analytics/components/TikTokPixelGroupCard";
import { Tooltip } from "@/components/shared/Tooltip";

import {
  TIKTOK_CONFIG_WORKSPACES,
  type TikTokConfigOwner,
} from "@/features/analytics/tiktok-config-workspace";

interface PixelConfig {
  id?: string;
  pixel_id: string;
  events_token: string;
  token_last_four?: string | null;
  has_events_token?: boolean;
  keep_events_token?: boolean;
}

export interface TikTokPixelConfigCopy {
  loadFailed: string; pixelRequired: string; saveFailed: string; saved: string;
  title: string; description: string; groups: string; tokenHint: string;
  addTooltip: string; limitTooltip: string; addGroup: string; emptyTitle: string;
  emptyDescription: string; saving: string; requiredFields: string;
  saveTooltip: string; save: string; group: Partial<TikTokPixelGroupCopy>;
}

const KURDISH_COPY: TikTokPixelConfigCopy = {
  loadFailed: "بارکردنی ڕێکخستنەکانی TikTok سەرکەوتوو نەبوو",
  pixelRequired: "Pixel ID بۆ هەر گرووپێک پێویستە",
  saveFailed: "پاشەکەوتکردن سەرکەوتوو نەبوو", saved: "ڕێکخستنەکانی TikTok نوێکرانەوە",
  title: "پەیوەستکردنی TikTok", description: TIKTOK_CONFIG_WORKSPACES.business.description,
  groups: "گرووپەکانی Pixel و Events API",
  tokenHint: "هەر tokenێک تەنها لەگەڵ Pixel IDی هەمان گرووپ بەکار دەکەوێت.",
  addTooltip: "زیادکردنی گرووپێکی نوێی TikTok", limitTooltip: "گەیشتوویتە سنووری ڕێگەپێدراوی Pixel",
  addGroup: "زیادکردنی گرووپ", emptyTitle: "هیچ گرووپێکی TikTok نییە",
  emptyDescription: "گرووپێک زیاد بکە، Pixel ID دابنێ و ئەگەر دەتەوێت گەیاندنی ڕاژەکار چالاک بێت Events API token زیاد بکە.",
  saving: "پاشەکەوت دەکرێت...", requiredFields: "تکایە هەموو خانە پێویستەکان پڕبکەرەوە",
  saveTooltip: "پاشەکەوتکردنی ڕێکخستنەکانی TikTok", save: "پاشەکەوتکردن",
  group: {},
};

function normalizeConfigs(value: unknown): PixelConfig[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row =
      item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const tokenLastFour =
      typeof row.token_last_four === "string" ? row.token_last_four : null;
    return {
      id: typeof row.id === "string" ? row.id : undefined,
      pixel_id: typeof row.pixel_id === "string" ? row.pixel_id : "",
      events_token: "",
      token_last_four: tokenLastFour,
      has_events_token: Boolean(row.has_events_token ?? tokenLastFour),
      keep_events_token: Boolean(row.has_events_token ?? tokenLastFour),
    };
  });
}

export function BusinessTikTokPixelConfigPage({
  owner = "business",
  copy,
}: {
  owner?: TikTokConfigOwner;
  copy?: Partial<TikTokPixelConfigCopy>;
} = {}) {
  const labels = { ...KURDISH_COPY, ...copy };
  const workspace = TIKTOK_CONFIG_WORKSPACES[owner];
  const [configs, setConfigs] = useState<PixelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [access, setAccess] = useState<EffectiveAccessManifest | null>(null);

  const pixelLimit = useMemo(() => {
    if (workspace.pixelLimit !== null) return workspace.pixelLimit;
    const raw = access?.entitlements["limit.tiktok_pixels"];
    if (typeof raw === "number") return raw;
    if (typeof raw === "string" && raw.trim()) {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }, [access, workspace.pixelLimit]);

  const canAdd = pixelLimit === -1 || configs.length < pixelLimit;
  const hasInvalidRows = configs.some((config) => !config.pixel_id.trim());

  const loadConfig = useCallback(
    async (rethrow = false) => {
      try {
        const [settingsResponse, accessResponse] = await Promise.all([
          fetch(workspace.settingsEndpoint, {
            credentials: "include",
            cache: "no-store",
          }),
          workspace.accessEndpoint
            ? fetch(workspace.accessEndpoint, {
                credentials: "include",
                cache: "no-store",
              })
            : Promise.resolve(
                new Response(JSON.stringify({ data: null }), { status: 200 }),
              ),
        ]);
        if (!settingsResponse.ok || !accessResponse.ok) {
          throw new Error(labels.loadFailed);
        }
        const [settingsPayload, accessPayload] = await Promise.all([
          settingsResponse.json(),
          accessResponse.json(),
        ]);
        setConfigs(normalizeConfigs(settingsPayload.data?.tiktok_configs));
        setAccess(workspace.accessEndpoint ? accessPayload.data || null : null);
      } catch (error) {
        if (rethrow) throw error;
        toast.error(labels.loadFailed);
      }
    },
    [workspace, labels.loadFailed],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConfig().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConfig]);

  useEffect(() => {
    const syncAccess = (event: Event) => {
      const detail = (event as CustomEvent<EffectiveAccessManifest>).detail;
      if (detail) setAccess(detail);
    };
    window.addEventListener("sponsor-krd:access-updated", syncAccess);
    return () =>
      window.removeEventListener("sponsor-krd:access-updated", syncAccess);
  }, []);

  const updateConfig = (index: number, patch: Partial<PixelConfig>) => {
    setConfigs((current) =>
      current.map((config, configIndex) =>
        configIndex === index ? { ...config, ...patch } : config,
      ),
    );
  };

  const save = async () => {
    if (hasInvalidRows) {
      toast.error(labels.pixelRequired);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(workspace.settingsEndpoint, {
        method: workspace.saveMethod,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(owner === "business" ? { section: "integrations" } : {}),
          tiktok_configs: configs.map((config) => ({
            id: config.id,
            pixel_id: config.pixel_id.trim(),
            events_token: config.events_token.trim(),
            keep_events_token:
              config.keep_events_token && !config.events_token.trim(),
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          copy ? labels.saveFailed : payload?.message || labels.saveFailed,
        );
      }
      const nextConfigs = normalizeConfigs(payload?.data?.tiktok_configs);
      setConfigs(nextConfigs);
      window.dispatchEvent(
        new CustomEvent("sponsor-krd:business-settings-updated", {
          detail: payload?.data,
        }),
      );
      toast.success(labels.saved);
    } catch (error) {
      toast.error(labels.saveFailed, {
        description: copy ? undefined : error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonTikTokPixelConfig />;
  }

  return (
    <DashboardSurface>
      {/* Simple Page Header */}
      <PageHeader
        icon={KeyRound}
        title={labels.title}
        description={copy ? labels.description : workspace.description}
      />

      {/* Group Controls Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/5">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {labels.groups}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {labels.tokenHint}
          </p>
        </div>
        <Tooltip
          content={
            canAdd
              ? labels.addTooltip
              : labels.limitTooltip
          }
          side="bottom"
        >
          <button
            type="button"
            onClick={() =>
              canAdd &&
              setConfigs((current) => [
                ...current,
                {
                  pixel_id: "",
                  events_token: "",
                  has_events_token: false,
                  keep_events_token: false,
                },
              ])
            }
            disabled={!canAdd}
            className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            style={{
              borderColor:
                "color-mix(in srgb, var(--theme-primary) 28%, transparent)",
              background:
                "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
              color: "var(--theme-primary)",
            }}
          >
            <Plus className="h-4 w-4" />
            {labels.addGroup}
          </button>
        </Tooltip>
      </div>

      {/* Group Cards */}
      {configs.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            compact
            icon={CircleOff}
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {configs.map((config, index) => (
            <TikTokPixelGroupCard
              key={config.id || `group-${index}`}
              index={index}
              config={config}
              testEndpoint={workspace.testEndpoint}
              secretEndpoint={workspace.secretEndpoint}
              copy={copy?.group}
              onUpdate={(patch) => updateConfig(index, patch)}
              canDelete={configs.length > 1}
              onDelete={() =>
                setConfigs((current) =>
                  current.filter((_, configIndex) => configIndex !== index),
                )
              }
            />
          ))}
        </div>
      )}

      {/* Save Action Footer */}
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-5 dark:border-white/5">
        <Tooltip
          content={
            saving
              ? labels.saving
              : hasInvalidRows
                ? labels.requiredFields
                : labels.saveTooltip
          }
          side="top"
        >
          <button
            type="button"
            onClick={() => void save()}
            aria-busy={saving}
            disabled={hasInvalidRows || saving}
            className="theme-fill flex h-10 shrink-0 items-center gap-2 rounded-xl border border-transparent px-4 text-xs font-black text-[var(--theme-ink)] shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <MotionSpinner>
                <Loader2 className="h-4 w-4" />
              </MotionSpinner>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? labels.saving : labels.save}
          </button>
        </Tooltip>
      </div>
    </DashboardSurface>
  );
}
