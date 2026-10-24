"use client";
import { memo } from "react";
import { Check } from "lucide-react";
import { SOCIAL_PLATFORMS } from "../modal-constants";
import { PlatformBadge } from "@/lib/brand/PlatformVisuals";
import { Tooltip } from "@/components/shared/Tooltip";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { getEditorPlatformName, type EditorCopy } from "../editor-copy";

// Memoized platform button component
export const LinktreePlatformButton = memo(
  function LinktreePlatformButton({
    platform,
    isSelected,
    onToggle,
    copy,
  }: {
    platform: (typeof SOCIAL_PLATFORMS)[0];
    isSelected: boolean;
    onToggle: () => void;
    copy?: EditorCopy;
  }) {
    const platformName = copy ? getEditorPlatformName(platform.id, copy) : platform.name;
    return (
      <Tooltip
        content={
          isSelected ? `${copy?.removePlatform ?? "لابردنی"} ${platformName}` : `${copy?.selectPlatform ?? "دیاریکردنی"} ${platformName}`
        }
        side="top"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isSelected}
          className={`${SHARED_SOFT_BUTTON_CLASS} relative flex w-full flex-col items-center gap-2 p-3 cursor-pointer`}
        >
          {isSelected && (
            <span
              className="theme-fill absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[var(--theme-ink)]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
          {/* Fixed box so every platform tile is the same size, whether the brand is
            a glyph on a fill or a full-color mark that fills the chip itself. */}
          <PlatformBadge
            platform={platform.id}
            className="size-10 rounded-lg"
            iconClassName="size-5"
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {platformName}
          </span>
        </button>
      </Tooltip>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.platform.id === nextProps.platform.id &&
      prevProps.copy === nextProps.copy
    );
  },
);

LinktreePlatformButton.displayName = "PlatformButton";

