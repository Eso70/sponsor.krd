"use client";
import { PageListActions } from "@/components/shared/PageListActions";
import { Fragment } from "react";
import {
  AnalyticsShareButton,
  type AnalyticsSharingControl,
} from "@/features/analytics-sharing/components/AnalyticsShareButton";
import {
  PagePinButton,
  type PagePinControl,
} from "@/components/shared/PagePinButton";
import { ExternalLink, Eye, Edit, Trash2 } from "lucide-react";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import type { FormsCopy } from "../forms-copy";
import type { FormSummary } from "../types";

export interface FormActions {
  busy?: boolean;
  pinControl?: PagePinControl;
  sharing?: AnalyticsSharingControl;
  capabilities?: { create: boolean; update: boolean; remove: boolean };
  onOpen?: (form: FormSummary) => void;
  onAnalytics?: (form: FormSummary) => void;
  onEdit: (form: FormSummary) => void;
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
  const buttons = [
    ...primary,
    {
      label: copy.remove,
      icon: Trash2,
      tone: "red" as const,
      disabled: !capabilities.remove,
      onClick: () => actions.onDelete(form),
    },
  ];
  return (
    <PageListActions variant={variant}>
      {variant === "table" && (
        <PagePinButton
          id={form.id}
          pinned={form.isPinned}
          control={capabilities.update ? actions.pinControl : undefined}
          disabled={actions.busy}
        />
      )}
      {buttons.map(({ icon: Icon, ...button }, index) => (
        <Fragment key={button.label}>
          {index === primary.length && (
            <AnalyticsShareButton
              id={form.id}
              control={capabilities.update ? actions.sharing : undefined}
              presentation={variant}
            />
          )}
          <GridCardActionButton
            {...button}
            disabled={button.disabled || actions.busy}
            icon={Icon}
            presentation={variant}
            compact={variant === "table" || index >= primary.length}
            showLabel={variant === "grid" && index < primary.length}
          />
        </Fragment>
      ))}
      {actions.onOpen && form.slug && (
        <GridCardActionButton
          label={copy.open}
          icon={ExternalLink}
          tone="neutral"
          compact={true}
          presentation={variant}
          disabled={actions.busy || form.status !== "active"}
          onClick={() => actions.onOpen?.(form)}
        />
      )}
    </PageListActions>
  );
}
