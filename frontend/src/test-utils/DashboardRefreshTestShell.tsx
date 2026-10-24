import type { ReactNode } from "react";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeaderActionButton";
import {
  DashboardRefreshProvider,
  useDashboardRefreshController,
} from "@/components/shared/dashboard-refresh";

const noSharedRefresh = () => {};

/** Exercise page registrations through the same provider and header action as the dashboards. */
export function DashboardRefreshTestShell({
  children,
  onSharedRefresh = noSharedRefresh,
}: {
  children: ReactNode;
  onSharedRefresh?: () => void | Promise<void>;
}) {
  const value = useDashboardRefreshController(onSharedRefresh);
  return (
    <DashboardRefreshProvider value={value}>
      <header>
        <DashboardHeaderActionButton
          aria-label="Refresh"
          aria-busy={value.isRefreshing}
          disabled={value.isRefreshing}
          onClick={() => void value.refresh()}
        >
          Refresh
        </DashboardHeaderActionButton>
      </header>
      {children}
    </DashboardRefreshProvider>
  );
}
