"use client";
import { useCallback, useEffect, useState } from "react";
import { Ban, Plus, RefreshCw } from "lucide-react";
import type { BlockedSubdomains } from "@linktree/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import {
  blockSubdomain,
  getBlockedSubdomains,
  unblockSubdomain,
} from "@/features/subdomains/api";
import { subdomainCopy } from "@/features/subdomains/copy";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { BlockedSubdomainsTable } from "./BlockedSubdomainsTable";
import { AddBlockedSubdomainModal } from "./AddBlockedSubdomainModal";

export function BlockedSubdomainsSettings() {
  const { locale } = usePlatformLocale();
  const copy = subdomainCopy[locale];
  const [data, setData] = useState<BlockedSubdomains | null>(null);
  const [adding, setAdding] = useState(false);
  const [operation, setOperation] = useState<
    { type: "add" | "refresh" } | { type: "remove"; name: string } | null
  >(null);
  const [error, setError] = useState<"load" | "save" | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = operation !== null;
  const load = useCallback(
    (signal?: AbortSignal) =>
      getBlockedSubdomains(signal)
        .then((result) => {
          if (!signal?.aborted) {
            setData(result);
            setError(null);
          }
        })
        .catch(() => {
          if (!signal?.aborted) setError("load");
        }),
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function add(name: string) {
    if (busy) return;
    setOperation({ type: "add" });
    setError(null);
    setSaved(false);
    try {
      setData(await blockSubdomain(name));
      setSaved(true);
      setAdding(false);
    } finally {
      setOperation(null);
    }
  }
  async function remove(name: string) {
    if (busy || !data?.custom.includes(name) || data.system.includes(name))
      return;
    setOperation({ type: "remove", name });
    setError(null);
    setSaved(false);
    try {
      setData(await unblockSubdomain(name));
      setSaved(true);
    } catch {
      setError("save");
    } finally {
      setOperation(null);
    }
  }
  return (
    <DashboardSurface>
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Ban}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOperation({ type: "refresh" });
                setSaved(false);
                void load().finally(() => setOperation(null));
              }}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <RefreshCw
                className={`h-4 w-4 ${operation?.type === "refresh" ? "animate-spin" : ""}`}
              />
              {copy.refresh}
            </button>
            <SettingsActionButton
              label={copy.addNew}
              icon={Plus}
              disabled={busy || !data}
              onClick={() => setAdding(true)}
            />
          </div>
        }
      />
      <div className="mt-2 space-y-4 border-t border-slate-100 pt-5 dark:border-white/5">
        {error ? (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {error === "load" ? copy.loadError : copy.saveError}
          </p>
        ) : saved ? (
          <p
            role="status"
            className="text-xs text-emerald-600 dark:text-emerald-400"
          >
            {copy.updated}
          </p>
        ) : null}
        <BlockedSubdomainsTable
          data={data}
          locale={locale}
          isLoading={!data && !error}
          busy={busy}
          removing={operation?.type === "remove" ? operation.name : null}
          onDelete={(name) => void remove(name)}
        />
      </div>
      {adding && (
        <AddBlockedSubdomainModal
          locale={locale}
          busy={operation?.type === "add"}
          onClose={() => setAdding(false)}
          onAdd={add}
        />
      )}
    </DashboardSurface>
  );
}
