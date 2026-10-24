"use client";

import { HEADER_ACTION_SIZE_CLASS } from "./shared-control-styles";
import { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";
import { RefreshCw } from "lucide-react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";

export function AuthenticationRefreshButton({
  refreshing,
  onRefresh,
  label = "Refresh application status",
}: {
  refreshing: boolean;
  onRefresh: () => void;
  label?: string;
}) {
  return (
    <DashboardHeaderActionButton
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={label}
      aria-busy={refreshing}
      className={HEADER_ACTION_SIZE_CLASS}
    >
      <MotionSpinner active={refreshing}>
        <RefreshCw className="h-4 w-4" />
      </MotionSpinner>
    </DashboardHeaderActionButton>
  );
}
