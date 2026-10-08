"use client";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Globe,
  Plus,
  RefreshCw,
  Settings2,
  Star,
  Trash2,
} from "lucide-react";
import type { BusinessDomain, BusinessDomains } from "@linktree/types";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  ManagementTable,
  MANAGEMENT_TABLE_ROW_CLASS,
  MANAGEMENT_TABLE_CARD_CLASS,
} from "@/components/shared/ManagementTable";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { ApiRequestError } from "@/lib/api/request";
import { domainCopy, type DomainLocale } from "../copy";
import {
  addDomain,
  domainAction,
  domainEndpoint,
  loadDomains,
  type DomainScope,
} from "../api";
import { AddDomainModal } from "./AddDomainModal";
import { DomainDnsModal } from "./DomainDnsModal";
import { openSelectedBusinessWorkspace } from "../domain-navigation";

export function BusinessDomainsPanel({
  scope,
  locale,
  canManage = true,
}: {
  scope: DomainScope;
  locale: DomainLocale;
  canManage?: boolean;
}) {
  const copy = domainCopy[locale];
  const endpoint = domainEndpoint(scope);
  const [data, setData] = useState<BusinessDomains | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BusinessDomain | null>(null);
  const selected = data?.domains.find((domain) => domain.id === selectedId);
  const load = useCallback(
    (signal?: AbortSignal) =>
      loadDomains(endpoint, signal)
        .then((result) => {
          if (!signal?.aborted) {
            setData(result);
            setError(null);
          }
        })
        .catch(() => {
          if (!signal?.aborted) setError(copy.loadError);
        }),
    [endpoint, copy.loadError],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const awaitingDns =
    !!data?.enabled &&
    data.domains.some((domain) => domain.status !== "active");
  useEffect(() => {
    if (!awaitingDns || busy) return;
    let controller: AbortController | null = null;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible" || controller) return;
      controller = new AbortController();
      const signal = controller.signal;
      void loadDomains(endpoint, signal)
        .then((result) => {
          if (!signal.aborted) setData(result);
        })
        .catch(() => {
          if (!signal.aborted) setError(copy.loadError);
        })
        .finally(() => {
          controller = null;
        });
    }, 15000);
    return () => {
      clearInterval(timer);
      controller?.abort();
    };
  }, [awaitingDns, busy, endpoint, copy.loadError]);
  async function add(hostname: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await addDomain(endpoint, hostname);
      setData(result);
      setAdding(false);
      setSelectedId(result.domains.at(-1)?.id || null);
    } finally {
      setBusy(false);
    }
  }
  async function act(id: string, action: "verify" | "primary" | "remove") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await domainAction(endpoint, id, action);
      setData(result);
      if (action === "verify") setSelectedId(id);
      if (action === "remove") setDeleting(null);
      if (scope.surface === "business") openSelectedBusinessWorkspace(result);
    } catch (cause) {
      setError(
        action === "primary" &&
          cause instanceof ApiRequestError &&
          cause.status === 503
          ? copy.tlsPending
          : action === "verify" &&
              cause instanceof ApiRequestError &&
              cause.status === 503
            ? copy.dnsUnavailable
            : copy.error,
      );
      if (action === "remove") throw cause;
    } finally {
      setBusy(false);
    }
  }
  const actions = (domain: BusinessDomain) => (
    <div className="flex justify-end gap-1">
      <IconActionButton
        label={`${copy.instructions}: ${domain.hostname}`}
        disabled={busy}
        onClick={() => setSelectedId(domain.id)}
      >
        <Settings2 className="h-4 w-4" />
      </IconActionButton>
      {canManage && (
        <>
          <IconActionButton
            label={`${copy.verify}: ${domain.hostname}`}
            disabled={busy || !data?.enabled}
            onClick={() => void act(domain.id, "verify")}
          >
            <CheckCircle2 className="h-4 w-4" />
          </IconActionButton>
          <IconActionButton
            label={`${copy.makePrimary}: ${domain.hostname}`}
            disabled={
              busy ||
              domain.status !== "active" ||
              domain.isPrimary ||
              !data?.enabled
            }
            onClick={() => void act(domain.id, "primary")}
          >
            <Star className="h-4 w-4" />
          </IconActionButton>
          <IconActionButton
            label={`${copy.remove}: ${domain.hostname}`}
            disabled={busy}
            tone="danger"
            onClick={() => setDeleting(domain)}
          >
            <Trash2 className="h-4 w-4" />
          </IconActionButton>
        </>
      )}
    </div>
  );
  const status = (domain: BusinessDomain) => (
    <span
      className={`text-xs ${domain.status === "active" ? "text-emerald-600" : "text-slate-500"}`}
    >
      {copy[domain.status]}
      {domain.isPrimary ? ` · ${copy.primary}` : ""}
    </span>
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Globe}
        action={
          <div className="flex gap-2">
            <IconActionButton
              label={copy.refresh}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void load().finally(() => setBusy(false));
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </IconActionButton>
            {canManage && (
              <SettingsActionButton
                label={copy.add}
                icon={Plus}
                disabled={busy || !data?.enabled || data.domains.length > 0}
                onClick={() => setAdding(true)}
              />
            )}
          </div>
        }
      />
      {error && (
        <p role="alert" className="text-xs text-rose-500">
          {error}
        </p>
      )}
      {data && !data.enabled && (
        <p className="text-xs leading-5 text-slate-500">{copy.setup}</p>
      )}
      {data?.enabled && canManage && data.domains.length > 0 && (
        <p className="text-xs leading-5 text-slate-500">{copy.limit}</p>
      )}
      {awaitingDns && (
        <p className="text-xs leading-5 text-slate-500">{copy.automatic}</p>
      )}
      <ManagementTable
        compact
        data={data?.domains || []}
        isLoading={!data && !error}
        columns={[
          { key: "hostname", header: copy.hostname },
          { key: "status", header: copy.status },
          {
            key: "actions",
            header: copy.actions,
            width: "w-40",
            className: "text-right",
          },
        ]}
        getRowKey={(domain) => domain.id}
        empty={{ icon: Globe, title: copy.empty }}
        pagination={{ mode: "client" }}
        paginationCopy={{
          of: copy.of,
          previous: copy.previous,
          next: copy.next,
        }}
        renderRow={(domain) => (
          <tr className={MANAGEMENT_TABLE_ROW_CLASS}>
            <td className="px-3 py-2 text-xs">
              <span dir="ltr" className="break-all">
                {domain.hostname}
              </span>
            </td>
            <td className="px-3 py-2">{status(domain)}</td>
            <td className="px-3 py-2">{actions(domain)}</td>
          </tr>
        )}
        renderCard={(domain) => (
          <div
            className={`${MANAGEMENT_TABLE_CARD_CLASS} flex-wrap items-center justify-between`}
          >
            <div className="min-w-0">
              <p dir="ltr" className="break-all text-xs">
                {domain.hostname}
              </p>
              {status(domain)}
            </div>
            {actions(domain)}
          </div>
        )}
      />
      {adding && (
        <AddDomainModal
          locale={locale}
          busy={busy}
          onClose={() => setAdding(false)}
          onAdd={add}
        />
      )}
      {selected && data && (
        <DomainDnsModal
          domain={selected}
          config={data}
          locale={locale}
          busy={busy}
          canManage={canManage}
          error={error}
          onClose={() => setSelectedId(null)}
          onVerify={() => void act(selected.id, "verify")}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          isOpen
          zIndexClassName="z-[160]"
          title={copy.deleteTitle}
          message={`${deleting.hostname}: ${copy.deleteMessage}`}
          confirmLabel={copy.remove}
          loadingLabel={copy.saving}
          cancelLabel={copy.cancel}
          closeLabel={copy.close}
          isDeleting={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => act(deleting.id, "remove")}
        />
      )}
    </div>
  );
}
