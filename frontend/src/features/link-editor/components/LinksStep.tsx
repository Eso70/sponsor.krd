"use client";
import { memo, useId, useMemo } from "react";
import { SOCIAL_PLATFORMS } from "../modal-constants";
import type { SocialLink } from "../types";
import type { EditorCopy } from "../editor-copy";
import type { ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import { LinktreeLinkItem } from "./LinktreeLinkItem";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import { getEditorPlatformName } from "../editor-copy";

interface LinksStepProps {
  copy?: EditorCopy;
  colorCopy?: ColorGradientModalProps["copy"];
  selectedPlatforms: string[];
  socialLinks: SocialLink[];
  linkErrors: Record<string, string>;
  error?: string;
  touched?: boolean;
  onUpdateLink: (id: string, value: string) => void;
  onUpdateCountryCode: (id: string, countryCode: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
  onUpdateCustomColor: (id: string, customColor: string) => void;
  onUpdateCustomIcon: (id: string, customIcon: string) => void;
  onRemoveLink: (id: string) => void;
  onAddPlatformInstance: (platformId: string) => void;
  onReorderLink: (source: string, target: string) => void;
  onBlurLink: (id: string) => void;
  iconUploadUrl?: string;
}

export const LinksStep = memo(function LinksStep({
  copy,
  colorCopy,
  selectedPlatforms,
  socialLinks,
  linkErrors,
  error,
  touched,
  onUpdateLink,
  onUpdateCountryCode,
  onUpdateDisplayName,
  onUpdateCustomColor,
  onUpdateCustomIcon,
  onRemoveLink,
  onAddPlatformInstance,
  onReorderLink,
  onBlurLink,
  iconUploadUrl,
}: LinksStepProps) {
  const reorderGroup = useId();
  const reorderLabel = formEditorCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb").reorder;
  // Create lookup maps for O(1) access
  const linksMap = useMemo(() => {
    return new Map(socialLinks.map(link => [link.id, link]));
  }, [socialLinks]);

  const platformsMap = useMemo(() => {
    return new Map(SOCIAL_PLATFORMS.map(platform => [platform.id, platform]));
  }, []);

  const sortedLinks = useMemo(() => {
    return selectedPlatforms
      .map(linkId => {
        const link = linksMap.get(linkId);
        if (!link) return null;
        const platform = platformsMap.get(link.platform);
        if (!platform) return null;
        return { linkId, platform, link };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (a.platform.id === "gps") return 1;
        if (b.platform.id === "gps") return -1;
        return (a.link.order ?? 0) - (b.link.order ?? 0);
      });
  }, [selectedPlatforms, linksMap, platformsMap]);

  if (sortedLinks.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-8">
          {copy?.noPlatforms ?? "هیچ پلاتفۆڕمەکانێک هەڵنەبژێردراوە"}
        </p>
        {error && touched && (
          <p className="text-xs text-red-600 text-center font-kurdish">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {copy?.addLinksHint ?? "لینک بۆ پلاتفۆڕمە هەڵبژێردراوەکان زیاد بکە"}
        </p>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {sortedLinks.length} {copy?.linkCount ?? "لینک"}
        </span>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {sortedLinks.map(({ linkId, platform, link }, index) => {
          if (!platform || !link) return null;
          const isGps = platform.id === "gps";
          const currentValue = link.value || "";
          const linkError = linkErrors[linkId];

          return (
            <LinktreeLinkItem
              copy={copy}
              colorCopy={colorCopy}
              key={linkId}
              linkId={linkId}
              platform={platform}
              isGps={isGps}
              currentValue={currentValue}
              countryCode={link.countryCode || "964"}
              displayName={link.displayName}
              customColor={link.customColor}
              customIcon={link.customIcon}
              error={linkError}
              onUpdate={onUpdateLink}
              onUpdateCountryCode={onUpdateCountryCode}
              onUpdateDisplayName={onUpdateDisplayName}
              onUpdateCustomColor={onUpdateCustomColor}
              onUpdateCustomIcon={onUpdateCustomIcon}
              onRemove={onRemoveLink}
              onAdd={onAddPlatformInstance}
              reorderGroup={!isGps ? reorderGroup : undefined}
              dragHandle={!isGps && <ReorderHandle id={linkId} group={reorderGroup}
                label={`${reorderLabel} ${copy ? getEditorPlatformName(platform.id, copy) : platform.name} ${index + 1}`}
                onReorder={onReorderLink} onStep={(offset) => {
                  const target = sortedLinks[index + offset];
                  if (target && target.platform.id !== "gps") onReorderLink(linkId, target.linkId);
                }} />}
              onBlurLink={onBlurLink}
              iconUploadUrl={iconUploadUrl}
            />
          );
        })}
      </div>
      
      {error && touched && (
        <p className="text-xs text-red-600 mt-2 text-center font-kurdish">{error}</p>
      )}
    </div>
  );
});
