"use client";

import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { Plus } from "lucide-react";

/**
 * Dashed full-width "add" button matching public-page editors'
 * repeatable-list affordance. Shared so new
 * editable lists reuse the same control instead of a new copy.
 */
export function EditorAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${SHARED_SOFT_BUTTON_CLASS} flex min-h-10 w-full items-center justify-center gap-2 px-3 py-3 text-xs font-semibold`}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
