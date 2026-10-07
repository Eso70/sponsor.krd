"use client";
import { useId, useState } from "react";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { SettingsField } from "@/components/shared/SettingsField";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { getRootDomain } from "@/lib/utils/app-url";
import { ApiRequestError } from "@/lib/api/request";
import { subdomainCopy } from "@/features/subdomains/copy";

export function AddBlockedSubdomainModal({
  locale,
  busy,
  onClose,
  onAdd,
}: {
  locale: keyof typeof subdomainCopy;
  busy: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}) {
  const copy = subdomainCopy[locale];
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<"invalid" | "conflict" | "save" | null>(
    null,
  );
  const message =
    error === "invalid"
      ? copy.invalid
      : error === "conflict"
        ? copy.conflict
        : error === "save"
          ? copy.saveError
          : null;
  async function submit() {
    if (busy || !value.trim()) return;
    const name = value.trim().toLowerCase();
    setError(null);
    try {
      await onAdd(name);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError && cause.status === 409
          ? "conflict"
          : cause instanceof ApiRequestError && cause.status === 400
            ? "invalid"
            : "save",
      );
    }
  }
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={copy.addNew}
      description={copy.description}
      busy={busy}
      closeLabel={copy.close}
      footer={
        <ModalFooterActions
          submitLabel={copy.add}
          submittingLabel={copy.saving}
          cancelLabel={copy.cancel}
          isSubmitting={busy}
          submitDisabled={!value.trim()}
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
        <SettingsField label={copy.label} htmlFor={id}>
          <ModalTextInput
            dir="ltr"
            suffix={`.${getRootDomain().split(":")[0]}`}
            id={id}
            value={value}
            maxLength={63}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
            hasError={error === "invalid" || error === "conflict"}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            placeholder="example"
            onChange={(event) => {
              setValue(event.target.value.toLowerCase());
              setError(null);
            }}
          />
        </SettingsField>
        <p id={`${id}-help`} className="mt-2 text-xs leading-5 text-slate-400">
          {copy.policy}
        </p>
        {message && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-3 text-xs text-rose-600 dark:text-rose-400"
          >
            {message}
          </p>
        )}
      </form>
    </ManagementModal>
  );
}
