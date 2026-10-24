"use client";
import { useRef } from "react";
import type { LinktreeListItem } from "@linktree/types";
import { EditorPageActions } from "@/components/shared/EditorPageActions";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import { sharedArabicLinktreeCopy } from "../shared-arabic-copy";
import { KURDISH_LINKTREE_LIST_COPY } from "./linktree-list-copy";
import { businessMessages } from "@/features/business/i18n/messages";
import { toast } from "sonner";

export interface LinktreeEditorManagement {
  item: LinktreeListItem;
  onToggleStatus?: (
    id: string,
    status: "active" | "inactive",
  ) => void | Promise<void>;
  onToggleArchive?: (id: string, archived: boolean) => void | Promise<void>;
  onDuplicated?: () => void;
}
export function LinktreeEditorPageActions({
  management,
  locale,
  disabled,
  onBusyChange,
  onDuplicate,
}: {
  management: LinktreeEditorManagement;
  locale: "en" | "ar" | "ckb";
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onDuplicate?: () => void;
}) {
  const lock = useRef(false);
  const { item } = management;
  const labels =
    locale === "en"
      ? englishBusinessMessages.LinktreeList
      : locale === "ar"
        ? sharedArabicLinktreeCopy.list
        : KURDISH_LINKTREE_LIST_COPY;
  const run = async (operation: () => void | Promise<void>) => {
    if (lock.current || disabled) return;
    lock.current = true;
    onBusyChange(true);
    try {
      await operation();
    } catch (error) {
      console.error("Linktree editor action failed:", error);
      toast.error(businessMessages[locale].DashboardActions.statusFailed);
    } finally {
      lock.current = false;
      onBusyChange(false);
    }
  };
  return (
    <>
      <EditorPageActions
        disabled={disabled}
        paused={item.status === "inactive"}
        archived={!!item.is_archived}
        labels={{
          pause: labels.deactivate,
          resume: labels.activate,
          archive: labels.archive,
          restore: labels.restore,
          duplicate: labels.duplicate,
        }}
        onPause={
          !item.is_default && management.onToggleStatus
            ? () => {
                void run(() =>
                  management.onToggleStatus!(
                    item.id,
                    item.status === "inactive" ? "active" : "inactive",
                  ),
                );
              }
            : undefined
        }
        onArchive={
          !item.is_default && management.onToggleArchive
            ? () => {
                void run(() =>
                  management.onToggleArchive!(item.id, !item.is_archived),
                );
              }
            : undefined
        }
        onDuplicate={management.onDuplicated ? onDuplicate : undefined}
      />
    </>
  );
}
