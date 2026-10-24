"use client";
import { useCallback, useEffect, useState } from "react";
import { Ban, Plus } from "lucide-react";
import type { BlockedSubdomains } from "@linktree/types";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PageManagementActions } from "@/components/shared/PageManagementActions";
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
  const refreshing = useRegisterDashboardRefresh("blocked-subdomains", async () => {
    try { setData(await getBlockedSubdomains()); setError(null); }
    catch (error) { setError("load"); throw error; }
  });

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
    <PageManagementSection
        title={copy.title}
        description={copy.description}
        icon={<Ban className="size-5" />}
        toolbar={
          <PageManagementActions>
            <SettingsActionButton label={copy.addNew} icon={Plus} disabled={busy || refreshing || !data} onClick={() => setAdding(true)} />
          </PageManagementActions>
        }
    >
      <div className="space-y-4">
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
        <DashboardRefreshRegion loading={refreshing} label={platformLoadingCopy[locale].loading}>
        <BlockedSubdomainsTable
          data={data}
          locale={locale}
          isLoading={!data && !error}
          busy={busy}
          removing={operation?.type === "remove" ? operation.name : null}
          onDelete={(name) => void remove(name)}
        />
        </DashboardRefreshRegion>
      </div>
      {adding && (
        <AddBlockedSubdomainModal
          locale={locale}
          busy={operation?.type === "add"}
          onClose={() => setAdding(false)}
          onAdd={add}
        />
      )}
    </PageManagementSection>
  );
}
