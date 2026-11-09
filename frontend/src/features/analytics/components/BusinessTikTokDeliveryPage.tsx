"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  Clock,
  EyeOff,
  Layers,
  RefreshCw,
  RotateCw,
  Sparkles,
  Target,
} from "lucide-react";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import { TikTokDeliveryErrorRow } from "./TikTokDeliveryErrorRow";
import type { TikTokConfigOwner } from "../tiktok-config-workspace";
import { toast } from "sonner";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { LockedNotice } from "@/components/shared/LockedContent";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonTikTokDelivery } from "@/components/shared/SkeletonPageLayouts";
import { Tooltip } from "@/components/shared/Tooltip";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import type { TikTokDeliveryError } from "@/features/analytics/api";
import { useTranslations } from "next-intl";

interface TikTokHealth {
  connections: number;
  browserEvents: number;
  serverEvents: number;
  delivered: number;
  retrying: number;
  failed: number;
  deliveryRate: number;
  reconciliation: {
    internalConversions: number;
    serverAcceptedConversions: number;
  };
}

const EMPTY_HEALTH: TikTokHealth = {
  connections: 0,
  browserEvents: 0,
  serverEvents: 0,
  delivered: 0,
  retrying: 0,
  failed: 0,
  deliveryRate: 0,
  reconciliation: {
    internalConversions: 0,
    serverAcceptedConversions: 0,
  },
};

class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RequestError(
      payload.message || "داواکارییەکە سەرکەوتوو نەبوو",
      response.status,
    );
  }
  return payload.data as T;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function BusinessTikTokDeliveryPage({ embedded = false, owner = "business", canManage = true }: { embedded?: boolean; owner?: TikTokConfigOwner; canManage?: boolean } = {}) {
  const t = useTranslations("TikTokDelivery");
  const endpoint = owner === "platform" ? "/api/platform/settings/tiktok" : "/api/analytics/v2/tiktok";
  const requestId = useRef(0);
  const [health, setHealth] = useState<TikTokHealth>(EMPTY_HEALTH);
  const [errors, setErrors] = useState<TikTokDeliveryError[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [locked, setLocked] = useState(false);

  const load = useCallback(async (showError = false) => {
    const currentRequest = ++requestId.current;
    try {
      const [nextHealth, errorPayload] = await Promise.all([
        requestData<TikTokHealth>(`${endpoint}/health`),
        requestData<{ items: TikTokDeliveryError[] }>(
          `${endpoint}/errors`,
        ),
      ]);
      if (currentRequest !== requestId.current) return;
      setUnavailable(false);
      setHealth(nextHealth);
      setErrors(errorPayload.items || []);
      setLocked(false);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      if (error instanceof RequestError && error.status === 403) {
        setLocked(true);
        setHealth(EMPTY_HEALTH);
        setErrors([]);
        return;
      }
      setUnavailable(true);
      if (showError) toast.error(t("refreshFailed"));
      throw error;
    }
  }, [t, endpoint]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
      toast.success(t("refreshed"));
    } catch {
      // The user-facing error is handled by load.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [load, t]);

  const globallyRefreshing = useRegisterDashboardRefresh("analytics:tracking", () => load(true));

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void load()
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [load]);

  const dismissErrors = async () => {
    const throughAttemptId = errors.reduce((max, item) => BigInt(item.dismissThrough) > BigInt(max) ? item.dismissThrough : max, "0");
    setRefreshing(true);
    try {
      await requestData(`${endpoint}/errors/dismiss`, { method: "POST", body: JSON.stringify({ throughAttemptId }) });
      await load();
      toast.success(t("dismissed"));
    } catch { toast.error(t("dismissFailed")); }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    const requests = requestId;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load().catch(() => undefined);
    }, 30_000);
    return () => { window.clearInterval(timer); requests.current++; };
  }, [load]);

  const retryFailed = async () => {
    setRefreshing(true);
    try {
      const result = await requestData<{ retried: number }>(
        `${endpoint}/retry-failed`,
        { method: "POST" },
      );
      toast.success(`${formatNumber(result.retried)} ${t("retriedSuccess")}`);
      await load();
    } catch {
      toast.error(t("retryFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || refreshing || globallyRefreshing) return <SkeletonTikTokDelivery embedded={embedded} loadingLabel={t("loadingDelivery")} />;

  if (unavailable) return <RequestErrorNotice message={t("refreshFailed")} />;

  const pixelSilent = health.serverEvents > 0 && health.browserEvents === 0;

  const Surface = embedded ? "div" : DashboardSurface;
  return (
    <Surface>
      {/* Header */}
      {!embedded && <PageHeader
        icon={Target}
        title={t("title")}
        description={t("description")}
        action={
          <Tooltip content={t("refreshTooltip")} side="bottom">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-busy={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200 cursor-pointer"
              aria-label={t("refresh")}
            >
              <MotionSpinner active={refreshing}>
                <RefreshCw className="h-4 w-4" />
              </MotionSpinner>
            </button>
          </Tooltip>
        }
      />}

      {locked ? (
        <div className="border-t border-slate-100 pt-5 dark:border-white/5">
          <LockedNotice
            icon={Target}
            title={t("lockedTitle")}
            description={t("lockedDescription")}
          />
        </div>
      ) : (
        <div className={embedded ? "space-y-5" : "space-y-6 border-t border-slate-100 pt-5 dark:border-white/5"}>
          {/* Status / Alert Banner */}
          {health.failed > 0 ? (
            <div className={embedded ? "flex flex-wrap items-center justify-between gap-3 py-3" : "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/[0.06]"}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-900 dark:text-red-100">
                    {formatNumber(health.failed)} {t("failedEvents")}
                  </p>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80">
                    {t("failureHint")}
                  </p>
                </div>
              </div>
              <Tooltip
                content={t("retryTooltip")}
                side="top"
              >
                <button
                  type="button"
                  onClick={() => void retryFailed()}
                  disabled={refreshing || !canManage}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>{t("retryButton")} ({health.failed})</span>
                </button>
              </Tooltip>
            </div>
          ) : health.retrying > 0 ? (
            <div className={embedded ? "flex items-center gap-3 py-3" : "flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06]"}>
              <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  {formatNumber(health.retrying)} {t("queuedEvents")}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  {t("queuedHint")}
                </p>
              </div>
            </div>
          ) : null}

          {/* Reconciliation Card (بەراوردکردنی ئەنجامەکان) */}
          <div className={embedded ? "min-w-0" : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-slate-900/30 sm:p-6"}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[var(--theme-primary)]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t("reconciliation")}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("reconciliationDescription")}
                </p>
              </div>

              {/* Match indicator badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {health.reconciliation.internalConversions ===
                  health.reconciliation.serverAcceptedConversions &&
                health.reconciliation.internalConversions > 0
                  ? t("matched")
                  : health.reconciliation.internalConversions === 0
                    ? t("noConversions")
                    : `${formatNumber(
                        Math.abs(
                          health.reconciliation.internalConversions -
                            health.reconciliation.serverAcceptedConversions,
                        ),
                      )} ${t("difference")}`}
              </span>
            </div>

            {embedded ? (
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">{t("recordedLocally")}</dt><dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatNumber(health.reconciliation.internalConversions)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">{t("receivedByTikTok")}</dt><dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatNumber(health.reconciliation.serverAcceptedConversions)}</dd></div>
              </dl>
            ) : (
            <StatCardGrid columns={2} className="mt-5">
              <StatCard icon={Layers} label={t("recordedLocally")} value={formatNumber(health.reconciliation.internalConversions)} subtitle={t("localDescription")} color="slate" />
              <StatCard icon={CheckCheck} label={t("receivedByTikTok")} value={formatNumber(health.reconciliation.serverAcceptedConversions)} subtitle={t("tiktokDescription")} color="blue" />
            </StatCardGrid>
            )}
          </div>

          {/* Diagnostics & Error Logs Section */}
          <div className={embedded ? "min-w-0" : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-slate-900/30 sm:p-6"}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{t("noticeHint")}</p>
              {errors.length > 0 && canManage && <button type="button" disabled={refreshing} onClick={() => void dismissErrors()} className="rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50">{t("dismissNotices")}</button>}
              {errors.length > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                  {errors.length} {t("errors")}
                </span>
              )}
              </div>
            <div className={errors.length > 0 ? "mt-4" : undefined}>
              {pixelSilent && (
                <div className={embedded ? "mb-3 py-3" : "mb-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/10"}>
                  <div className="flex items-start gap-3">
                    <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        {t("pixelSilent")}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {health.serverEvents} {t("pixelSilentDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errors.length > 0 ? (
                <ul className="space-y-2.5">
                  {errors.map((item) => (
                    <TikTokDeliveryErrorRow
                      flat={embedded}
                      key={`${item.destinationId}:${item.statusCode ?? "none"}:${item.message}`}
                      item={item}
                    />
                  ))}
                </ul>
              ) : !pixelSilent ? (
                <div className={embedded ? "flex items-center gap-3 py-2" : "flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-500/10 dark:bg-emerald-500/[0.03]"}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {health.failed > 0 || health.retrying > 0 ? t("noNotices") : t("healthy")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {health.failed > 0 || health.retrying > 0 ? t("noticeHint") : t("healthyDescription")}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Surface>
  );
}
