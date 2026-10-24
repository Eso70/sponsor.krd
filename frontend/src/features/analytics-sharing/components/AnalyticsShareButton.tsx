"use client";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { Share2 } from "lucide-react";
import { DrawerPresence } from "@/components/shared/DrawerPresence";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { sharingCopy, type SharingLocale } from "../sharing-copy";
const ShareDrawer = dynamic(
  () =>
    import("./AnalyticsShareDrawer").then((module) => ({
      default: module.AnalyticsShareDrawer,
    })),
  { ssr: false },
);
export interface AnalyticsSharingControl {
  apiBase: string;
  locale: SharingLocale;
  disabled?: boolean;
  accentColor?: string | null;
  platformTheme?: boolean;
  pageType?: "form" | "linktree";
  headerControls?: ReactNode;
}
export function AnalyticsShareButton({
  id,
  control,
  presentation = "table",
}: {
  id: string;
  control?: AnalyticsSharingControl;
  presentation?: "grid" | "table";
}) {
  const [open, setOpen] = useState(false);
  if (!control) return null;
  return (
    <>
      <GridCardActionButton
        label={sharingCopy(control.locale).share}
        icon={Share2}
        tone="cyan"
        compact
        stopPropagation
        presentation={presentation}
        disabled={control.disabled}
        onClick={() => setOpen(true)}
      />
      <DrawerPresence>{open && (
        <ShareDrawer
          apiBase={`${control.apiBase}/${id}/analytics-shares`}
          locale={control.locale}
          accentColor={control.accentColor}
          platformTheme={control.platformTheme}
          pageType={control.pageType}
          headerControls={control.headerControls}
          onClose={() => setOpen(false)}
        />
      )}</DrawerPresence>
    </>
  );
}
