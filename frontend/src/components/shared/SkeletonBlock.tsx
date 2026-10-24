"use client";
import type { CSSProperties } from "react";
import { MotionPulse } from "@/components/motion/MotionPrimitives";

/** Shared placeholder primitive; geometry belongs to the content it replaces. */
const SURFACE = "bg-slate-200/70 dark:bg-white/10";

export function Skeleton({
  className = "",
  rounded = "rounded-xl",
  style,
}: {
  className?: string;
  rounded?: string;
  style?: CSSProperties;
}) {
  return (
    <MotionPulse
      aria-hidden="true"
      data-skeleton
      className={`block ${SURFACE} ${rounded} ${className}`}
      style={style}
    />
  );
}
