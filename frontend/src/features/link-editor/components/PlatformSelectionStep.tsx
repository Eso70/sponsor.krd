"use client";

import { memo, useMemo } from "react";
import { SOCIAL_PLATFORMS } from "../modal-constants";
import type { SocialLink } from "@/features/link-editor/types";
import { LinktreePlatformButton } from "./LinktreePlatformButton";
import { getEditorPlatformName, type EditorCopy } from "../editor-copy";
import { EDITOR_CARD_CLASS } from "@/components/shared/editor-control-styles";

interface PlatformSelectionStepProps {
  copy?: EditorCopy;
  socialLinks: SocialLink[];
  error?: string;
  touched?: boolean;
  onTogglePlatform: (platformId: string) => void;
}

export const PlatformSelectionStep = memo(function PlatformSelectionStep({
  copy,
  socialLinks,
  error,
  touched,
  onTogglePlatform,
}: PlatformSelectionStepProps) {
  const selectedPlatformsMap = useMemo(() => {
    return new Set(socialLinks.map((l) => l.platform));
  }, [socialLinks]);
  const selectedPlatformOptions = useMemo(
    () =>
      SOCIAL_PLATFORMS.filter((platform) =>
        selectedPlatformsMap.has(platform.id),
      ),
    [selectedPlatformsMap],
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {copy?.selectPlatformsTitle ?? "پلاتفۆڕمەکان هەڵبژێرە"}
      </p>
      {selectedPlatformOptions.length > 0 && (
        <div className={`${EDITOR_CARD_CLASS} p-3`}>
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {selectedPlatformOptions.length} {copy?.selectedCount ?? "پلاتفۆڕم هەڵبژێردراوە"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedPlatformOptions.map((platform) => (
              <span
                key={platform.id}
                className="rounded-xl bg-[var(--shared-control-surface)] px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                {copy ? getEditorPlatformName(platform.id, copy) : platform.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <LinktreePlatformButton
            copy={copy}
            key={platform.id}
            platform={platform}
            isSelected={selectedPlatformsMap.has(platform.id)}
            onToggle={() => onTogglePlatform(platform.id)}
          />
        ))}
      </div>
      {error && touched && (
        <p className="text-xs text-red-500 mt-2 text-center font-kurdish">
          {error}
        </p>
      )}
    </div>
  );
});
