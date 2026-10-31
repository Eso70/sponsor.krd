"use client";

import { memo } from "react";
import { Archive, CirclePause, MessageCircle, Star } from "lucide-react";
import { getRecordAgeBadge } from "@/lib/utils/record-age";
import { getTemplateName } from "@/lib/templates/config";
import type { LinktreeListItem } from "@linktree/types";
import { ANALYTICS_TERMS } from "@/components/shared/analytics-terminology";
import { Tooltip } from "@/components/shared/Tooltip";
import { KURDISH_LINKTREE_LIST_COPY, type LinktreeListCopy } from "@/features/link-editor/components/linktree-list-copy";

const PILL_BASE =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold leading-none";

export const LinktreePill = memo(function LinktreePill({
  label,
  title,
  className = "",
  icon,
}: {
  label: string;
  title?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  const pill = (
    <span className={`${PILL_BASE} ${className}`}>
      {icon}
      {label}
    </span>
  );
  if (title) {
    return <Tooltip content={title} side="top">{pill}</Tooltip>;
  }
  return pill;
});

export interface LinktreeMetaBadgesProps {
  item: Pick<
    LinktreeListItem,
    | "created_at"
    | "is_default"
    | "seo_name"
    | "status"
    | "template_key"
    | "whatsapp_modal_enabled"
  > & {
    id?: string;
    is_archived?: boolean;
  };
  /**
   * Age badges read `created_at`, which only the Linktree dashboard populates
   * with a real creation date, so callers opt in.
   */
  showAgeBadge?: boolean;
  showTemplate?: boolean;
  className?: string;
  listCopy?: Partial<LinktreeListCopy>;
}

export interface PageListTrafficLabels {
  column: string;
  views: string;
  interactions: string;
}

export const LINKTREE_TRAFFIC_LABELS: PageListTrafficLabels = {
  column: "ترافیک",
  views: ANALYTICS_TERMS.uniqueViewer,
  interactions: ANALYTICS_TERMS.uniqueClicker,
};

/**
 * Status pills shared by the Linktree grid card, table row and mobile card.
 * Every pill is field-gated so consumers that reuse the list components with a
 * partial projection simply render fewer pills.
 */
export const LinktreeMetaBadges = memo(function LinktreeMetaBadges({
  item,
  showAgeBadge = false,
  showTemplate = false,
  className = "",
  listCopy,
}: LinktreeMetaBadgesProps) {
  const labels = { ...KURDISH_LINKTREE_LIST_COPY, ...listCopy };
  const ageBadge = showAgeBadge && item.created_at ? getRecordAgeBadge(item.created_at) : null;
  const templateName = showTemplate ? getTemplateName(item.template_key) : null;
  const isInactive = item.status === "inactive";
  const hasWhatsappModal = item.whatsapp_modal_enabled === true;
  const isArchived = !!item.is_archived;

  if (
    !item.is_default &&
    !ageBadge &&
    !templateName &&
    !isInactive &&
    !hasWhatsappModal &&
    !isArchived
  )
    return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {item.is_default && (
        <Tooltip content={labels.defaultPageHint} side="top">
          <span
            className={`${PILL_BASE} border-transparent cursor-default`}
            style={{
              background:
                "color-mix(in srgb, var(--theme-primary, #64748b) 14%, white)",
              color: "var(--theme-primary, #64748b)",
            }}
          >
            <Star className="h-2.5 w-2.5" />
            {labels.defaultPage}
          </span>
        </Tooltip>
      )}

      {ageBadge && (
        <LinktreePill
          label={listCopy ? labels[`${ageBadge.tier}Age` as "newAge" | "growingAge" | "oldAge"] : ageBadge.label}
          title={listCopy ? labels[`${ageBadge.tier}AgeHint` as "newAgeHint" | "growingAgeHint" | "oldAgeHint"] : ageBadge.title}
          className={ageBadge.className}
        />
      )}
      {isInactive && (
        <LinktreePill
          label={labels.inactive}
          title={labels.inactiveHint}
          className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          icon={<CirclePause className="h-2.5 w-2.5" />}
        />
      )}
      {hasWhatsappModal && (
        <LinktreePill
          label={labels.whatsapp}
          title={labels.whatsappHint}
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
          icon={<MessageCircle className="h-2.5 w-2.5" />}
        />
      )}
      {templateName && (
        <LinktreePill
          label={templateName}
          title={`${labels.template} ${templateName}`}
          className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
        />
      )}
      {isArchived && (
        <Tooltip content={labels.archivedHint} side="top">
          <span
            className={`${PILL_BASE} border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 cursor-default text-[9.5px] px-2 py-0.5`}
          >
            <Archive className="h-2.5 w-2.5" />
            {labels.archived}
          </span>
        </Tooltip>
      )}

    </div>
  );
});

