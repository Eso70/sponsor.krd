import type { ReactNode } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeaderActionButton";
import { Tooltip } from "@/components/shared/Tooltip";
import type { FormsCopy } from "../forms-copy";
import { FormExportMenu } from "./FormExportMenu";

export function FormInsightsActions({
  copy,
  headerControls,
  refreshing,
  refreshDisabled,
  exportDisabled,
  deleteDisabled,
  canDelete,
  onRefresh,
  onExport,
  onExportRange,
  onDelete,
}: {
  copy: FormsCopy;
  headerControls?: ReactNode;
  refreshing: boolean;
  refreshDisabled: boolean;
  exportDisabled: boolean;
  deleteDisabled: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onExportRange: () => void;
  onDelete: () => void;
}) {
  const className = "!size-9 !p-0";
  return (
    <>
      <Tooltip content={copy.refreshData} side="bottom">
        <DashboardHeaderActionButton
          className={className}
          aria-label={copy.refreshData}
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </DashboardHeaderActionButton>
      </Tooltip>
      <FormExportMenu
        copy={copy}
        disabled={exportDisabled}
        onExport={onExport}
        onExportRange={onExportRange}
      />
      {canDelete && (
        <Tooltip content={copy.deleteResponses} side="bottom">
          <DashboardHeaderActionButton
            className={`${className} !text-rose-600 dark:!text-rose-300`}
            aria-label={copy.deleteResponses}
            disabled={deleteDisabled}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </DashboardHeaderActionButton>
        </Tooltip>
      )}
      {headerControls && (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-slate-400/20" />
          {headerControls}
        </>
      )}
    </>
  );
}
