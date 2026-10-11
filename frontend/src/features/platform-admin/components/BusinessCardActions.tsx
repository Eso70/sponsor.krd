"use client";

import { Edit, Eye, LogIn, ShieldCheck, Trash2 } from "lucide-react";
import type { PlatformBusiness } from "@linktree/types";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { usePlatformCopy } from "../i18n/copy";
import { BusinessDomainManagementButton } from "./BusinessDomainManagementButton";

export interface BusinessCardActionsProps {
  item: PlatformBusiness;
  onEdit?: (business: PlatformBusiness) => void;
  onDelete?: (id: string, name: string) => void;
  onViewAnalytics?: (business: PlatformBusiness) => void;
  onManageSessions?: (business: PlatformBusiness) => void;
  onOpenDashboard?: (business: PlatformBusiness) => void;
  onManageDomains?: (business: PlatformBusiness) => void;
}

export function BusinessCardActions({
  item,
  onEdit,
  onDelete,
  onViewAnalytics,
  onManageSessions,
  onOpenDashboard,
  onManageDomains,
}: BusinessCardActionsProps) {
  const copy = usePlatformCopy();
  const canOpen =
    !!onOpenDashboard && !!item.subdomain && item.status === "active";
  const count = [
    onEdit,
    onDelete,
    onViewAnalytics,
    onManageSessions,
    canOpen,
    onManageDomains,
  ].filter(Boolean).length;
  if (!count) return null;
  return (
    <div
      className="mt-auto flex min-w-0 flex-nowrap items-center gap-1 border-t border-gray-200 pt-2 dark:border-white/10 sm:gap-1.5 sm:pt-2.5"
    >
      {onViewAnalytics && (
        <div className="flex min-w-0 flex-[2]">
          <GridCardActionButton
            label={`${copy.viewAnalytics}: ${item.name}`}
            text={copy.analytics}
            icon={Eye}
            tone="sky"
            showLabel
            onClick={() => onViewAnalytics(item)}
          />
        </div>
      )}
      {onEdit && (
        <div className="flex min-w-0 flex-[2]">
          <GridCardActionButton
            label={`${copy.edit}: ${item.name}`}
            text={copy.edit}
            icon={Edit}
            tone="amber"
            showLabel
            onClick={() => onEdit(item)}
          />
        </div>
      )}
      {onManageDomains && (
        <BusinessDomainManagementButton
          variant="grid"
          name={item.name}
          onClick={() => onManageDomains(item)}
        />
      )}
      {onManageSessions && (
        <GridCardActionButton
          label={`${copy.sessions}: ${item.name}`}
          icon={ShieldCheck}
          tone="emerald"
          onClick={() => onManageSessions(item)}
        />
      )}
      {canOpen && onOpenDashboard && (
        <GridCardActionButton
          label={`${copy.openDashboard}: ${item.name}`}
          icon={LogIn}
          tone="indigo"
          onClick={() => onOpenDashboard(item)}
        />
      )}
      {onDelete && (
        <GridCardActionButton
          label={`${copy.delete}: ${item.name}`}
          icon={Trash2}
          tone="red"
          onClick={() => onDelete(item.id, item.name)}
        />
      )}
    </div>
  );
}
