"use client";
import {
  Archive,
  ArchiveRestore,
  CirclePause,
  CirclePlay,
  CopyPlus,
} from "lucide-react";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { ACTION_ICON_TONES } from "./action-icon-tones";

export interface EditorPageActionLabels {
  pause: string;
  resume: string;
  archive: string;
  restore: string;
  duplicate: string;
}
/** Secondary saved-page actions, shared by Form and Linktree editors. */
export function EditorPageActions({
  labels,
  paused,
  archived,
  disabled,
  onPause,
  onArchive,
  onDuplicate,
}: {
  labels: EditorPageActionLabels;
  paused: boolean;
  archived: boolean;
  disabled?: boolean;
  onPause?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
}) {
  const actions = [
    {
      label: paused ? labels.resume : labels.pause,
      icon: paused ? CirclePlay : CirclePause,
      iconColor: paused ? ACTION_ICON_TONES.success : ACTION_ICON_TONES.warning,
      onClick: onPause,
    },
    {
      label: archived ? labels.restore : labels.archive,
      icon: archived ? ArchiveRestore : Archive,
      iconColor: archived
        ? ACTION_ICON_TONES.success
        : ACTION_ICON_TONES.archive,
      onClick: onArchive,
    },
    {
      label: labels.duplicate,
      icon: CopyPlus,
      iconColor: ACTION_ICON_TONES.info,
      onClick: onDuplicate,
    },
  ].filter((action) => action.onClick && action.label);
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={disabled}>
      {actions.map(({ label, icon: Icon, iconColor, onClick }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex h-9 items-center justify-center gap-2 px-3 text-xs font-medium disabled:opacity-40`}
        >
          <Icon aria-hidden className={`size-4 shrink-0 ${iconColor}`} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
