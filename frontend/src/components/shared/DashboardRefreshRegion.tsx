import type { ReactNode } from "react";
import { LoadingState } from "./LoadingState";

/** Keeps mounted editors and collection state while pending data is refreshed. */
export function DashboardRefreshRegion({ loading, label, children }: {
  loading: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy={loading || undefined}>
      {loading && <LoadingState compact title={label} />}
      <div hidden={loading}>{children}</div>
    </div>
  );
}
