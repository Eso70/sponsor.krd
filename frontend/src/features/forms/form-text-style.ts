import type { CSSProperties } from "react";
import { normalizeHex } from "@/lib/utils/color-conversion";
import type { FormTextStyle } from "./types";

export function textSpacing(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(80, value))
    : 0;
}
/** Plain text and typed styles only: authored HTML is never executed. */
export function formTextStyle(style: FormTextStyle = {}): CSSProperties {
  return {
    fontWeight: style.bold ? 700 : style.heading ? 600 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    fontSize:
      style.heading === 1
        ? 24
        : style.heading === 2
          ? 20
          : style.heading === 3
            ? 16
            : 13,
    lineHeight: 1.6,
    textAlign: ["start", "center", "end", "justify"].includes(style.align ?? "")
      ? style.align
      : "start",
    color: normalizeHex(style.color ?? "", "") || undefined,
    paddingTop: textSpacing(style.marginTop),
    paddingBottom: textSpacing(style.marginBottom),
  };
}
