"use client";

import { SHARED_NESTED_CARD_CLASS } from "@/components/shared/shared-surface-styles";

import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";

import { useCallback, useEffect, useState } from "react";
import { Monitor, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { Tooltip } from "@/components/shared/Tooltip";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { useRegisterDashboardRefresh } from "./dashboard-refresh";
import { SkeletonSessionList } from "@/components/shared/SkeletonCommunicationLayouts";

export type ManagedSession = {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  session_expires_at: string;
  is_current: boolean;
  remembered: boolean;
};

export type SessionManagementCopy = Partial<Record<
  "loadFailed" | "revokeFailed" | "revoked" | "activeSessions" | "description" |
  "refresh" | "empty" | "current" | "remembered" | "unknownIp" | "expires" |
  "revokeSession" | "revokeAllTooltip" | "signOutOthers" | "revokeAll" |
  "dialogTitle" | "dialogConfirm" | "dialogLoading" | "dialogMessage" |
  "dialogCancel" | "dialogClose" |
  "unknownDevice" | "unknownTime" | "browserOn" | "loading",
  string
>>;

export function SessionManagementPanel({
  endpoint,
  administratorMode = false,
  copy,
  dateLocale,
  onCountChange,
}: {
  endpoint: string;
  administratorMode?: boolean;
  copy?: SessionManagementCopy;
  dateLocale?: string;
  onCountChange?: (count: number | null) => void;
}) {
  const startRequest = useLatestRequest();
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<"all" | ManagedSession | null>(
    null,
  );

  const load = useCallback(async (rethrow = false) => {
    const current = startRequest();
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "GET", credentials: "include", cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.data?.sessions))
        throw new Error("Unable to load sessions");
      if (!current()) return;
      setSessions(payload.data.sessions);
      onCountChange?.(payload.data.sessions.length);
    } catch (error) {
      if (!current()) return;
      onCountChange?.(null);
      toast.error(copy?.loadFailed ?? "Unable to load sessions");
      if (rethrow) throw error;
    } finally {
      if (current()) setLoading(false);
    }
  }, [endpoint, copy, onCountChange, startRequest]);
  const refreshing = useRegisterDashboardRefresh(`sessions:${endpoint}`, () => load(true));

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(timer);
      startRequest();
    };
  }, [load, startRequest]);

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      const url =
        pendingRevoke === "all" ? endpoint : `${endpoint}/${pendingRevoke.id}`;
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload.message || "Unable to revoke session");
      const remaining = pendingRevoke === "all"
        ? administratorMode ? [] : sessions.filter((session) => session.is_current)
        : sessions.filter((session) => session.id !== pendingRevoke.id);
      setSessions(remaining);
      onCountChange?.(remaining.length);
      toast.success(copy?.revoked ?? "Session access revoked");
    } catch (error) {
      toast.error(
        copy ? copy.revokeFailed ?? "Unable to revoke session" : error instanceof Error ? error.message : "Unable to revoke session",
      );
      throw error;
    } finally {
      setRevoking(false);
    }
  };

  const revocableSessions = sessions.filter(
    (session) => administratorMode || !session.is_current,
  );

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck
              className="h-5 w-5"
              style={{
                color: "var(--theme-primary, var(--sponsor-krd-accent))",
              }}
            />
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {copy?.activeSessions ?? "Active sessions"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {copy?.description ?? "Review devices with access to this business."}
              </p>
            </div>
          </div>
          <Tooltip content={copy?.refresh ?? "نوێکردنەوەی دانیشتنەکان"} side="bottom">
            <button
              type="button"
              onClick={() => void load()}
              aria-busy={loading}
              disabled={loading}
              className={`${SHARED_SOFT_BUTTON_CLASS} flex size-9 items-center justify-center disabled:opacity-50`}
              aria-label={copy?.refresh ?? "Refresh sessions"}
            >
              <MotionSpinner active={loading}>
                <RefreshCw className="h-4 w-4" />
              </MotionSpinner>
            </button>
          </Tooltip>
        </div>

        <div className="space-y-3">
          {(loading || refreshing) && sessions.length === 0 ? (
            <SkeletonSessionList rows={3} loadingLabel={copy?.loading} />
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              {copy?.empty ?? "No active sessions found."}
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`${SHARED_NESTED_CARD_CLASS} flex items-center gap-3 p-3`}
              >
                <Monitor className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                      {describeUserAgent(session.user_agent, copy)}
                    </p>
                    {session.is_current && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {copy?.current ?? "Current"}
                      </span>
                    )}
                    {session.remembered && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                        {copy?.remembered ?? "Remembered"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {session.ip_address || copy?.unknownIp || "Unknown IP"} ·{" "}
                    {formatDate(session.created_at, copy, dateLocale)} · {copy?.expires ?? "expires"}{" "}
                    {formatDate(session.session_expires_at, copy, dateLocale)}
                  </p>
                </div>
                {(administratorMode || !session.is_current) && (
                  <Tooltip
                    content={copy?.revokeSession ?? "لابردنی دەستگەیشتنی ئەم دانیشتنە"}
                    side="top"
                  >
                    <button
                      type="button"
                      onClick={() => setPendingRevoke(session)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      aria-label={copy?.revokeSession ?? "Revoke session"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                )}
              </div>
            ))
          )}
        </div>

        {revocableSessions.length > 0 && (
          <Tooltip
            content={
              administratorMode
                ? copy?.revokeAllTooltip ?? "لابردنی دەستگەیشتنی هەموو دانیشتنەکان"
                : copy?.signOutOthers ?? "چوونەدەرەوە لە هەموو ئامێرەکانی تر"
            }
            side="top"
          >
            <button
              type="button"
              onClick={() => setPendingRevoke("all")}
              className="mt-4 w-full cursor-pointer rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {administratorMode
                ? copy?.revokeAll ?? "Revoke all business sessions"
                : copy?.signOutOthers ?? "Sign out all other sessions"}
            </button>
          </Tooltip>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={pendingRevoke !== null}
        onClose={() => setPendingRevoke(null)}
        onConfirm={confirmRevoke}
        isDeleting={revoking}
        title={copy?.dialogTitle ?? "Revoke session access"}
        confirmLabel={copy?.dialogConfirm ?? "Revoke access"}
        loadingLabel={copy?.dialogLoading ?? "Revoking…"}
        cancelLabel={copy?.dialogCancel}
        closeLabel={copy?.dialogClose}
        message={copy?.dialogMessage ?? "This device will immediately lose access."}
        zIndexClassName="z-[80]"
      />
    </div>
  );
}

function describeUserAgent(userAgent: string | null, copy?: SessionManagementCopy): string {
  if (!userAgent) return copy?.unknownDevice ?? "Unknown device";
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Browser";
  const platform = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("iPhone") || userAgent.includes("iPad")
        ? "iOS"
        : userAgent.includes("Mac OS")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : copy?.unknownDevice ?? "Unknown device";
  return `${browser} ${copy?.browserOn ?? "on"} ${platform}`;
}

function formatDate(value: string, copy?: SessionManagementCopy, locale?: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? copy?.unknownTime ?? "Unknown time" : date.toLocaleString(locale);
}
