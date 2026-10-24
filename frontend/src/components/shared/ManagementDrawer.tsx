"use client";

import { ManagementModal, type ManagementModalProps } from "./ManagementModal";

/** Shared drawer animation, focus lifecycle, theme, and document scroll lock. */
export function ManagementDrawer(
  props: Omit<ManagementModalProps, "presentation">,
) {
  return <ManagementModal {...props} presentation="drawer" />;
}
