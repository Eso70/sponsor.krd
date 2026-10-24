import type { CSSProperties, ReactNode } from "react";
import { ThemeProvider } from "@/lib/contexts/ThemeProvider";
import { createSponsorKrdThemeVariables } from "@/lib/sponsor-krd-theme";
import { SkeletonDashboardShell } from "./Skeleton";

/** Loading boundaries inherit the same verified owner palette as the real dashboard. */
export function DashboardLoadingShell({
  scope,
  accentColor,
  children,
}: {
  scope: "business" | "platform";
  accentColor: string;
  children: ReactNode;
}) {
  return (
    <ThemeProvider
      websiteColor={accentColor}
      documentTheme={scope === "business" ? "business" : "theme-only"}
    >
      <div
        style={
          {
            display: "contents",
            ...(scope === "platform"
              ? createSponsorKrdThemeVariables(accentColor)
              : {}),
          } as CSSProperties
        }
      >
        <SkeletonDashboardShell platformAdminTheme={scope === "platform"}>
          {children}
        </SkeletonDashboardShell>
      </div>
    </ThemeProvider>
  );
}
