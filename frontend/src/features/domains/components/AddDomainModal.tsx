"use client";
import { useId, useState } from "react";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { SettingsField } from "@/components/shared/SettingsField";
import { ApiRequestError } from "@/lib/api/request";
import { domainCopy, type DomainLocale } from "../copy";

export function AddDomainModal({
  locale,
  busy,
  onClose,
  onAdd,
}: {
  locale: DomainLocale;
  busy: boolean;
  onClose: () => void;
  onAdd: (hostname: string) => Promise<void>;
}) {
  const copy = domainCopy[locale];
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (busy || !value.trim()) return;
    setError(null);
    try {
      await onAdd(value.trim().toLowerCase());
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.code === "CUSTOM_DOMAIN_LIMIT"
            ? copy.limit
            : cause.status === 409
              ? copy.conflict
              : cause.status === 400
                ? copy.invalid
                : cause.status === 503
                  ? copy.unavailable
                  : copy.error
          : copy.error,
      );
    }
  }
  return (
    <ManagementModal
      isOpen
      compactHeader
      title={copy.add}
      description={copy.hint}
      onClose={onClose}
      closeLabel={copy.close}
      busy={busy}
      footer={
        <ModalFooterActions
          submitLabel={copy.add}
          submittingLabel={copy.saving}
          cancelLabel={copy.cancel}
          submitDisabled={!value.trim()}
          isSubmitting={busy}
          onCancel={onClose}
          onSubmit={() => void submit()}
        />
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <SettingsField htmlFor={id} label={copy.hostname}>
          <ModalTextInput
            id={id}
            dir="ltr"
            maxLength={253}
            value={value}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={copy.placeholder}
            disabled={busy}
            hasError={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
          />
        </SettingsField>
        {error && (
          <p
            role="alert"
            id={`${id}-error`}
            className="mt-3 text-xs text-rose-500"
          >
            {error}
          </p>
        )}
      </form>
    </ManagementModal>
  );
}
