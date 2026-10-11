"use client";

import { useEffect } from "react";
import { ManagementModal, type ManagementModalProps } from "./ManagementModal";

/** End-side editor shell sharing the modal's theme, focus and keyboard stack. */
export function ManagementDrawer(
  props: Omit<ManagementModalProps, "presentation">,
) {
  useEffect(() => {
    if (!props.isOpen) return;
    const previous = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      document.documentElement.style.scrollbarGutter = previousGutter;
    };
  }, [props.isOpen]);
  return <ManagementModal {...props} presentation="drawer" />;
}
