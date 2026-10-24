import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { Tooltip } from "@/components/shared/Tooltip";
import type { EditorCopy } from "../editor-copy";
import type { ReactNode } from "react";
import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";

/** Compact fixed-footer actions shared by business and platform Linktree drawers. */
export function LinktreeEditorActions({
  editing,
  locale,
  loading,
  saving,
  valid,
  copy,
  onClose,
  onSubmit,
  managementActions,
}: {
  managementActions?: ReactNode;
  editing: boolean;
  locale: "en" | "ar" | "ckb";
  loading: boolean;
  saving: boolean;
  valid: boolean;
  copy?: EditorCopy;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const actions = pageActionCopy(locale);
  return (
    <div
      className="flex w-full flex-wrap items-center justify-end gap-2"
      dir="ltr"
    >
      {managementActions && <div className="me-auto">{managementActions}</div>}
      <Tooltip content={valid ? undefined : copy?.requiredTooltip}>
        <div className="inline-flex gap-2">
          <ModalFooterActions
            compact
            cancelLabel={actions.cancel}
            submitLabel={editing ? actions.save : actions.create}
            submitDisabled={loading}
            isSubmitting={saving}
            submittingLabel={actions.saving}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </Tooltip>
    </div>
  );
}
