"use client";

import { useIsMounted } from "@/hooks/useIsMounted";
import { DrawerPresence } from "./DrawerPresence";
import { ManagementDialog } from "./ManagementDialog";

export interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  compactHeader?: boolean;
  stackHeaderOnMobile?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  progress?: React.ReactNode;
  headerAction?: React.ReactNode;
  flushFooter?: boolean;
  /** Contained lets desktop editors own their pane scrolling; mobile keeps body scrolling. */
  bodyLayout?: "scroll" | "centered" | "contained";
  wide?: boolean;
  extraWide?: boolean;
  busy?: boolean;
  createBusinessStyle?: boolean;
  sponsorKrdTheme?: boolean;
  locked?: boolean;
  /**
   * The colour this modal's controls should use, when it is editing something
   * that has a colour of its own.
   *
   * The modal renders through a portal on `document.body`, so without this it
   * inherits `--sponsor-krd-accent` — SponsorKrd's own accent — and a business ends up
   * designing their page surrounded by our brand colour. Setting the accent
   * variables here rather than in each field means every reusable control
   * inside (checkboxes, selects, wizard actions) follows along untouched.
   */
  accentColor?: string | null;
  closeLabel?: string;
  presentation?: "modal" | "drawer";
}

/** Hydration-safe dialog boundary; drawers retain their chrome through exit. */
export function ManagementModal(props: ManagementModalProps) {
  const mounted = useIsMounted();
  const content =
    props.isOpen && mounted ? <ManagementDialog {...props} /> : null;
  return props.presentation === "drawer" ? (
    <DrawerPresence inheritSession>{content}</DrawerPresence>
  ) : (
    content
  );
}
