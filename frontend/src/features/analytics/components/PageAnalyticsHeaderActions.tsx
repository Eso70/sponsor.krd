import type { ReactNode } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeaderActionButton";
import { Tooltip } from "@/components/shared/Tooltip";
import type { PageAnalyticsCopy } from "../page-analytics-copy";

export function PageAnalyticsHeaderActions({
  labels,
  canClear,
  hasData,
  refreshing,
  clearing,
  onClear,
  onRefresh,
  headerControls,
}: {
  labels: PageAnalyticsCopy;
  canClear: boolean;
  hasData: boolean;
  refreshing: boolean;
  clearing: boolean;
  onClear: () => void;
  onRefresh: () => void;
  headerControls?: ReactNode;
}) {
  return (
    <>
      {canClear && (
        <Tooltip
          content={hasData ? labels.clearAll : labels.nothingToClear}
          side="bottom"
        >
          <DashboardHeaderActionButton
            className="!size-9 !p-0 !text-rose-500"
            aria-label={labels.clearData}
            disabled={refreshing || clearing || !hasData}
            onClick={onClear}
          >
            <Trash2 className="size-4" />
          </DashboardHeaderActionButton>
        </Tooltip>
      )}
      <Tooltip content={labels.refresh} side="bottom">
        <DashboardHeaderActionButton
          className="!size-9 !p-0"
          aria-label={labels.refresh}
          disabled={refreshing}
          aria-busy={refreshing}
          onClick={onRefresh}
        >
          <MotionSpinner active={refreshing}>
            <RefreshCw className="size-4" />
          </MotionSpinner>
        </DashboardHeaderActionButton>
      </Tooltip>
      {headerControls && (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-slate-400/20" />
          {headerControls}
        </>
      )}
    </>
  );
}
