"use client";

import { SHARED_ACTION_CLASS, SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import type { ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";

/**
 * The small icon control used for row actions — reorder, remove, add.
 *
 * Shared so public-page cards and the link editor's platform rows
 * cannot drift apart: they had grown two near-identical sets of classes with
 * different padding, radius, hover colours and dark-mode behaviour.
 */
export function IconActionButton({
  onClick,
  label,
  tone = "neutral",
  disabled = false,
  expanded,
  children,
}: {
  onClick?: () => void;
  /** Used as both the tooltip and the accessible name. */
  label: string;
  tone?: "neutral" | "danger" | "surface";
  disabled?: boolean;
  expanded?: boolean;
  children: ReactNode;
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-rose-500/[0.05] text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
      : tone === "surface"
        ? SHARED_SOFT_BUTTON_CLASS
        : SHARED_SOFT_BUTTON_CLASS;

  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-expanded={expanded}
        className={`${SHARED_ACTION_CLASS} inline-flex size-8 shrink-0 items-center justify-center align-middle rounded-xl p-1.5 leading-none transition disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer ${toneClasses}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
