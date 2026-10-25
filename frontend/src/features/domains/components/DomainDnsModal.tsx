"use client";
import type { BusinessDomain, BusinessDomains } from "@linktree/types";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { domainCopy, type DomainLocale } from "../copy";
import { domainDnsCopy } from "../dns-copy";
import { DomainDnsInstructions } from "./DomainDnsInstructions";

export function DomainDnsModal({
  domain,
  config,
  locale,
  busy,
  canManage,
  error,
  onClose,
  onVerify,
  onPrimary,
}: {
  domain: BusinessDomain;
  config: BusinessDomains;
  locale: DomainLocale;
  busy: boolean;
  canManage: boolean;
  error?: string | null;
  onClose: () => void;
  onVerify: () => void;
  onPrimary: () => void;
}) {
  const copy = domainCopy[locale];
  const guide = domainDnsCopy[locale];
  const ready = domain.status === "active" && !domain.isPrimary;
  const status = domain.isPrimary
    ? guide.primary
    : domain.status === "active"
      ? guide.verified
      : domain.status === "disconnected"
        ? guide.disconnected
        : guide.pending;
  return (
    <ManagementModal
      isOpen
      wide
      title={`${copy.instructions}: ${domain.hostname}`}
      description={guide.intro}
      onClose={onClose}
      closeLabel={copy.close}
      busy={busy}
      footer={
        canManage ? (
          <ModalFooterActions
            submitLabel={ready ? copy.makePrimary : copy.verify}
            submittingLabel={copy.saving}
            cancelLabel={copy.close}
            submitDisabled={!config.enabled}
            isSubmitting={busy}
            onCancel={onClose}
            onSubmit={ready ? onPrimary : onVerify}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && (
          <p role="alert" className="text-xs text-rose-500">
            {error}
          </p>
        )}
        {!error && !busy && domain.lastError && (
          <p role="alert" className="text-xs text-rose-500">
            {copy[domain.lastError]}
          </p>
        )}
        <p
          role="status"
          className="theme-soft rounded-xl border p-3 text-sm"
          dir={locale === "en" ? "ltr" : "rtl"}
        >
          {status}
        </p>
        <DomainDnsInstructions
          domain={domain}
          config={config}
          locale={locale}
        />
      </div>
    </ManagementModal>
  );
}
