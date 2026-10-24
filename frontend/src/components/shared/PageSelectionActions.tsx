"use client";

import { Trash2, ChartNoAxesCombined, CheckCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CollapsibleRegion } from "./CollapsibleRegion";
import styles from "./page-management.module.css";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { pageSelectionCopy } from "./page-selection-copy";

interface PageSelectionActionsProps {
  resource?: "page" | "form";
  ids: readonly string[];
  locale: "en" | "ar" | "ckb";
  disabled: boolean;
  onSelectAll: () => void;
  onDeselect: () => void;
  onDelete?: (ids: readonly string[]) => Promise<void>;
  onDeleteRecords?: (ids: readonly string[]) => Promise<void>;
  deletableIds?: readonly string[];
}

export function PageSelectionActions({
  ids,
  locale,
  disabled,
  onSelectAll,
  onDeselect,
  onDelete,
  onDeleteRecords,
  deletableIds = ids,
  resource = "page",
}: PageSelectionActionsProps) {
  const copy = pageSelectionCopy(locale);
  const [confirmIds, setConfirmIds] = useState<{
    action: "analytics" | "records";
    ids: readonly string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const deleting = useRef(false);
  const buttonClass = `${SHARED_SOFT_BUTTON_CLASS} inline-flex min-h-[var(--page-control-height,40px)] items-center justify-center gap-1.5 px-3 text-xs font-semibold disabled:opacity-40`;

  const deleteSelected = async () => {
    if (!confirmIds?.ids.length || deleting.current || disabled) return;
    const allowed = confirmIds.action === "records" ? deletableIds : ids;
    const handler =
      confirmIds.action === "records" ? onDeleteRecords : onDelete;
    if (!handler || !confirmIds.ids.every((id) => ids.includes(id) && allowed.includes(id))) {
      setConfirmIds(null);
      return;
    }
    deleting.current = true;
    setBusy(true);
    try {
      await handler(confirmIds.ids);
      onDeselect();
      setConfirmIds(null);
      toast.success(
        confirmIds.action === "analytics"
          ? copy.success
          : resource === "form"
            ? copy.deleteFormsSuccess
            : copy.deleteSuccess,
      );
    } catch (error) {
      console.error("Selected page operation failed:", error);
      toast.error(
        confirmIds.action === "analytics"
          ? copy.failed
          : resource === "form"
            ? copy.deleteFormsFailed
            : copy.deleteFailed,
      );
      if (confirmIds.action === "records") setConfirmIds(null);
      throw error;
    } finally {
      deleting.current = false;
      setBusy(false);
    }
  };

  const deletingRecords = confirmIds?.action === "records";
  const title = deletingRecords
    ? resource === "form"
      ? copy.deleteForms
      : copy.deletePages
    : copy.remove;
  return (
    <>
      <CollapsibleRegion open={ids.length > 0}>
        <div
          className={styles.selectionActions}
          role="group"
          aria-label={`${ids.length} ${copy.selected}`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {ids.length} {copy.selected}
          </span>
          <button
            type="button"
            className={buttonClass}
            disabled={disabled || busy}
            onClick={onSelectAll}
          >
            <CheckCheck className="size-4" />
            {copy.all}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={disabled || busy}
            onClick={onDeselect}
          >
            <X className="size-4" />
            {copy.none}
          </button>
          {onDelete && (
            <button
              type="button"
              className={`${buttonClass} ${styles.selectionAnalytics}`}
              disabled={disabled || busy}
              onClick={() =>
                setConfirmIds({ action: "analytics", ids: [...ids] })
              }
            >
              <ChartNoAxesCombined aria-hidden className="size-4" />
              {copy.remove}
            </button>
          )}
          {onDeleteRecords && (
            <button
              type="button"
              className={`${buttonClass} ${styles.selectionDelete}`}
              disabled={disabled || busy || !deletableIds.length}
              onClick={() =>
                setConfirmIds({ action: "records", ids: [...deletableIds] })
              }
            >
              <Trash2 aria-hidden className="size-4" />
              {resource === "form" ? copy.deleteForms : copy.deletePages}
            </button>
          )}
        </div>
      </CollapsibleRegion>
      <ConfirmDeleteModal
        isOpen={confirmIds !== null}
        title={title}
        tone={deletingRecords ? "danger" : "warning"}
        message={
          <p>
            {deletingRecords
              ? resource === "form"
                ? copy.deleteFormsQuestion
                : copy.deletePagesQuestion
              : resource === "form"
                ? copy.formQuestion
                : copy.question}{" "}
            ({confirmIds?.ids.length ?? 0})
          </p>
        }
        confirmLabel={title}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        loadingLabel={copy.busy}
        isDeleting={busy}
        onClose={() => {
          if (!deleting.current) setConfirmIds(null);
        }}
        onConfirm={deleteSelected}
      />
    </>
  );
}
