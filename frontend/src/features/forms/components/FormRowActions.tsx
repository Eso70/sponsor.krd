"use client";
import { useState } from "react";
import {
  ExternalLink,
  CirclePause,
  CirclePlay,
  Archive,
  ArchiveRestore,
  Eye,
  Edit,
  Trash2,
  Ellipsis,
} from "lucide-react";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { Tooltip } from "@/components/shared/Tooltip";
import type { FormsCopy } from "../forms-copy";
import type { FormSummary } from "../types";

export interface FormActions {
  busy?: boolean;
  capabilities?: { create: boolean; update: boolean; remove: boolean };
  onPause?: (form: FormSummary) => void;
  onOpen?: (form: FormSummary) => void;
  onAnalytics?: (form: FormSummary) => void;
  onEdit: (form: FormSummary) => void;
  onArchive: (form: FormSummary) => void;
  onDelete: (form: FormSummary) => void;
}
export function FormRowActions({
  form,
  copy,
  actions,
  variant = "table",
}: {
  form: FormSummary;
  copy: FormsCopy;
  actions: FormActions;
  variant?: "table" | "grid";
}) {
  const [expanded, setExpanded] = useState(false);
  const capabilities = actions.capabilities ?? {
    create: true,
    update: true,
    remove: true,
  };
  const primary = [
    ...(actions.onAnalytics
      ? [
          {
            label: copy.analytics,
            icon: Eye,
            tone: "sky" as const,
            onClick: () => actions.onAnalytics?.(form),
          },
        ]
      : []),
    {
      label: copy.edit,
      icon: Edit,
      tone: "amber" as const,
      disabled: !capabilities.update,
      onClick: () => actions.onEdit(form),
    },
  ];
  const secondary = [
    {
      label: form.isArchived ? copy.restore : copy.archive,
      icon: form.isArchived ? ArchiveRestore : Archive,
      tone: form.isArchived ? ("emerald" as const) : ("purple" as const),
      disabled: !capabilities.update,
      onClick: () => actions.onArchive(form),
    },
    ...(actions.onPause && capabilities.update
      ? [
          {
            label: form.status === "active" ? copy.pause : copy.resume,
            icon: form.status === "active" ? CirclePause : CirclePlay,
            tone:
              form.status === "active"
                ? ("rose" as const)
                : ("emerald" as const),
            onClick: () => actions.onPause?.(form),
          },
        ]
      : []),
  ];
  const buttons = [
    ...primary,
    ...(expanded ? secondary : []),
    {
      label: copy.remove,
      icon: Trash2,
      tone: "red" as const,
      disabled: !capabilities.remove,
      onClick: () => actions.onDelete(form),
    },
  ];
  return (
    <div
      className={`flex min-w-0 ${variant === "table" && expanded ? "flex-wrap" : "flex-nowrap"} items-center gap-1 sm:gap-1.5`}
    >
      {buttons.map(({ icon: Icon, ...button }, index) => (
        <GridCardActionButton
          key={button.label}
          {...button}
          disabled={button.disabled || actions.busy}
          icon={Icon}
          presentation={variant}
          compact={
            variant === "table" || (!expanded && index >= primary.length)
          }
          showLabel={variant === "grid" && !expanded && index < primary.length}
        />
      ))}
      {actions.onOpen && form.slug && (
        <GridCardActionButton
          label={copy.open}
          icon={ExternalLink}
          tone="neutral"
          compact={!expanded || variant === "table"}
          presentation={variant}
          disabled={actions.busy || form.status !== "active"}
          onClick={() => actions.onOpen?.(form)}
        />
      )}
      <Tooltip content={copy.moreActions} side="top">
        <button
          type="button"
          aria-label={copy.moreActions}
          aria-expanded={expanded}
          disabled={actions.busy}
          onClick={() => setExpanded((current) => !current)}
          className={
            variant === "grid"
              ? `flex h-8 items-center justify-center rounded-lg border border-slate-300/70 bg-slate-100/80 text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40 sm:h-9 sm:rounded-xl dark:border-white/15 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 ${expanded ? "min-w-0 flex-1" : "w-8 shrink-0 sm:w-9"}`
              : "shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
          }
        >
          <Ellipsis aria-hidden className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
