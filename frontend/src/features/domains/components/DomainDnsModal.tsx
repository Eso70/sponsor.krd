"use client";
import type { BusinessDomain, BusinessDomains } from "@linktree/types";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { CopyValueField } from "@/components/shared/CopyValueField";
import { domainCopy, type DomainLocale } from "../copy";

export function DomainDnsModal({
  domain,
  config,
  locale,
  busy,
  canManage,
  error,
  onClose,
  onVerify,
}: {
  domain: BusinessDomain;
  config: BusinessDomains;
  locale: DomainLocale;
  busy: boolean;
  canManage: boolean;
  error?: string | null;
  onClose: () => void;
  onVerify: () => void;
}) {
  const copy = domainCopy[locale];
  const copyText = {
    action: copy.copy,
    success: copy.copied,
    failure: copy.copyFailed,
  };
  return (
    <ManagementModal
      isOpen
      title={`${copy.instructions}: ${domain.hostname}`}
      description={copy.dnsHelp}
      onClose={onClose}
      closeLabel={copy.close}
      busy={busy}
      footer={
        canManage ? (
          <ModalFooterActions
            submitLabel={copy.verify}
            submittingLabel={copy.saving}
            cancelLabel={copy.close}
            submitDisabled={!config.enabled}
            isSubmitting={busy}
            onCancel={onClose}
            onSubmit={onVerify}
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
        <CopyValueField
          label={copy.txtName}
          value={`_sponsor-verification.${domain.hostname}`}
          copyName={copy.txtName}
          copyText={copyText}
        />
        <CopyValueField
          label={copy.txtValue}
          value={`sponsor-verification=${domain.verificationToken}`}
          copyName={copy.txtValue}
          copyText={copyText}
        />
        <CopyValueField
          label={copy.cnameName}
          value={domain.hostname}
          copyName={copy.cnameName}
          copyText={copyText}
        />
        <CopyValueField
          label={copy.cnameValue}
          value={config.target}
          copyName={copy.cnameValue}
          copyText={copyText}
        />
        <p className="text-xs leading-5 text-slate-500">{copy.apex}</p>
        <CopyValueField
          label={copy.address}
          value={[...config.ipv4, ...config.ipv6].join(", ")}
          copyName={copy.address}
          copyText={copyText}
        />
        <p className="text-xs leading-5 text-slate-500">{copy.primaryHelp}</p>
      </div>
    </ManagementModal>
  );
}
