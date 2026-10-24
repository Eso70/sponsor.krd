"use client";

import { memo, useCallback, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Trash2, Plus } from "lucide-react";
import { SOCIAL_PLATFORMS } from "../modal-constants";
import { IconPicker } from "@/components/ui/IconPicker";
import { CUSTOM_ICONS_MAP } from "@/lib/config/icons";
import { ColorGradientModal, type ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import { editorInputClass as modalInputClass, EDITOR_INPUT_CLASS, EDITOR_FIELD_CLASS, EDITOR_CARD_CLASS } from "@/components/shared/editor-control-styles";
import { EditorField } from "@/components/shared/EditorField";
import { editorDrawerCopy } from "../editor-drawer-copy";
import { StandardPlatformInput } from "./StandardPlatformInput";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { Tooltip } from "@/components/shared/Tooltip";
import { ColorPickerMark } from "@/components/shared/ColorPickerMark";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import React from "react";
import { parseUploadedIconValue } from "@/features/link-editor/custom-icon-value";
import { PlatformIcon } from "@/lib/brand/PlatformVisuals";
import { markFillsChip } from "@/lib/brand/platform-brands";
import { arabicIconPickerCopy, englishIconPickerCopy, getEditorPlatformName, localizeEditorUploadError, type EditorCopy } from "../editor-copy";

interface LinkItemProps {
  copy?: EditorCopy;
  colorCopy?: ColorGradientModalProps["copy"];
  linkId: string;
  platform: typeof SOCIAL_PLATFORMS[0];
  isGps: boolean;
  currentValue: string;
  countryCode?: string;
  displayName?: string;
  customColor?: string;
  customIcon?: string;
  error?: string;
  onUpdate: (id: string, value: string) => void;
  onUpdateCountryCode: (id: string, countryCode: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
  onUpdateCustomColor: (id: string, customColor: string) => void;
  onUpdateCustomIcon: (id: string, customIcon: string) => void;
  onRemove: (id: string) => void;
  onAdd: (platformId: string) => void;
  dragHandle?: ReactNode;
  reorderGroup?: string;
  onBlurLink: (id: string) => void;
  iconUploadUrl?: string;
}

export const LinktreeLinkItem = memo(function LinktreeLinkItem({
  copy,
  colorCopy,
  linkId,
  platform,
  isGps,
  currentValue,
  countryCode,
  displayName,
  customColor,
  customIcon,
  error,
  onUpdate,
  onUpdateCountryCode,
  onUpdateDisplayName,
  onUpdateCustomColor,
  onUpdateCustomIcon,
  onRemove,
  onAdd,
  dragHandle,
  reorderGroup,
  onBlurLink,
  iconUploadUrl,
}: LinkItemProps) {
  const labels = editorDrawerCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorAnchor = useRef<HTMLButtonElement>(null);
  const uploadedIcon = parseUploadedIconValue(customIcon);
  const colorDisabled = uploadedIcon?.hasBackground === true;
  const marksOwnChip =
    markFillsChip(platform.id, customColor) && !uploadedIcon && !customIcon;

  // Memoize handlers to prevent re-renders
  const handleUpdate = useCallback((value: string) => {
    onUpdate(linkId, value);
  }, [linkId, onUpdate]);

  const handleCountryCodeChange = useCallback((code: string) => {
    onUpdateCountryCode(linkId, code);
  }, [linkId, onUpdateCountryCode]);

  const handleDisplayNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDisplayName(linkId, e.target.value);
  }, [linkId, onUpdateDisplayName]);

  const handleCustomColorChange = useCallback((value: string) => {
    onUpdateCustomColor(linkId, value);
  }, [linkId, onUpdateCustomColor]);

  const handleRemove = useCallback(() => {
    onRemove(linkId);
  }, [linkId, onRemove]);

  const handleAdd = useCallback(() => {
    onAdd(platform.id);
  }, [platform.id, onAdd]);

  const handleBlur = useCallback(() => {
    onBlurLink(linkId);
  }, [linkId, onBlurLink]);

  return (
    <div
      data-reorder-id={reorderGroup ? linkId : undefined}
      data-reorder-group={reorderGroup}
      className={`${EDITOR_CARD_CLASS} flex flex-col gap-3 p-3`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-1">
          {dragHandle}
          <span className="block min-w-0 flex-1 truncate text-[13px] font-bold text-slate-600 dark:text-slate-300 select-none">
            {copy ? getEditorPlatformName(platform.id, copy) : platform.name}
            <RequiredMark />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IconActionButton
            onClick={handleRemove}
            tone="danger"
            label={`${copy?.removeLink ?? "سڕینەوەی"} ${copy ? getEditorPlatformName(platform.id, copy) : platform.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconActionButton>
          {!isGps && (
            <IconActionButton
              onClick={handleAdd}
              label={`${copy?.addAnother ?? "زیادکردنی لینکی تر بۆ"} ${copy ? getEditorPlatformName(platform.id, copy) : platform.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </IconActionButton>
          )}
        </div>
      </div>
      
      <div className="w-full">
        <div className="space-y-4">
          <EditorField label={labels.linkDestination} className={EDITOR_FIELD_CLASS} interactive>
            <div className="flex w-full min-w-0 items-center gap-2">
              <div className="shrink-0">
                <IconPicker
                  copy={copy?.language === "en" ? englishIconPickerCopy : copy ? arabicIconPickerCopy : undefined}
                  localizeError={copy ? (error) => localizeEditorUploadError(error, copy) : undefined}
                  value={customIcon || ""}
                  onChange={(icon) => onUpdateCustomIcon(linkId, icon)}
                  uploadUrl={iconUploadUrl}
                  customTrigger={
                    <div
                      // A full-color mark is the whole chip, so it loses the padding and
                      // fills the box instead of floating inside it.
                      className={`${marksOwnChip ? "size-10" : "flex size-10 items-center justify-center p-2"} rounded-lg shrink-0 relative overflow-hidden`}
                      style={
                        colorDisabled
                          ? undefined
                          : customColor
                            ? { background: customColor }
                            : { background: 'var(--tw-gradient-from)' }
                      }
                    >
                      {/* We apply the custom color as plain background style, or default to gradients */}
                      {!colorDisabled && !customColor && (
                        <div className="absolute inset-0" style={{ background: platform.background }} />
                      )}
                      {/* If customIcon is provided, render it instead of the default icon */}
                      {uploadedIcon ? (
                        <Image
                          src={uploadedIcon.url}
                          alt=""
                          width={48}
                          height={48}
                          className={
                            uploadedIcon.hasBackground
                              ? "absolute inset-0 z-10 h-full w-full object-cover"
                              : "relative z-10 size-5 object-contain"
                          }
                          unoptimized
                        />
                      ) : customIcon && CUSTOM_ICONS_MAP[customIcon] ? (
                        React.createElement(CUSTOM_ICONS_MAP[customIcon], { className: "size-5 text-white relative z-10" })
                      ) : (
                        <PlatformIcon
                          platform={platform.id}
                          customColor={customColor}
                          className={
                            marksOwnChip
                              ? "relative z-10 h-full w-full"
                              : "relative z-10 size-5"
                          }
                        />
                      )}
                    </div>
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <StandardPlatformInput
                  copy={copy}
                  ariaLabel={labels.linkDestination}
                  platform={platform.id}
                  value={currentValue}
                  onChange={handleUpdate}
                  countryCode={countryCode || "964"}
                  onCountryCodeChange={handleCountryCodeChange}
                  error={error}
                  revealError={Boolean(error)}
                  onBlur={handleBlur}
                  inputClassName={EDITOR_INPUT_CLASS}
                  countryClassName="!h-10 !rounded-lg !text-sm"
                />
              </div>
              <Tooltip
                content={
                  colorDisabled ? copy?.imageHasBackground ?? "ئەم وێنەیە پاشبنەمای خۆی هەیە" : copy?.buttonColor ?? "ڕەنگی دوگمە"
                }
                side="top"
              >
                <button
                  ref={colorAnchor}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={isColorPickerOpen}
                  onClick={() => setIsColorPickerOpen((current) => !current)}
                  disabled={colorDisabled}
                  className={`${SHARED_SOFT_BUTTON_CLASS} flex size-10 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-45`}
                  title={colorDisabled ? copy?.imageHasBackground ?? "ئەم وێنەیە پاشبنەمای خۆی هەیە" : copy?.buttonColor ?? "ڕەنگی دوگمە"}
                  aria-label={colorDisabled ? copy?.imageHasBackground ?? "ئەم وێنەیە پاشبنەمای خۆی هەیە" : copy?.buttonColor ?? "ڕەنگی دوگمە"}
                >
                  <ColorPickerMark value={colorDisabled ? undefined : customColor} />
                </button>
              </Tooltip>
              <ColorGradientModal
                anchorRef={colorAnchor}
                copy={colorCopy}
                isOpen={isColorPickerOpen}
                value={customColor || "#000000"}
                onChange={handleCustomColorChange}
                onClose={() => setIsColorPickerOpen(false)}
                solidFallback="#000000"
                gradientFallback="#0066ff"
              />
            </div>
          </EditorField>

          <EditorField label={labels.linkName} className={EDITOR_FIELD_CLASS} interactive>
            <input
              type="text"
              aria-label={labels.linkName}
              value={displayName || ""}
              onChange={handleDisplayNameChange}
              placeholder={labels.linkName}
              className={modalInputClass(false, "w-full")}
            />
          </EditorField>
          
        </div>
      </div>
    </div>
  );
});

