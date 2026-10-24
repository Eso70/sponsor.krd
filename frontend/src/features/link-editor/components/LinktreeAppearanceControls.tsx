"use client";

import { useCallback, useRef, useState } from "react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { ColorGradientModal } from "@/components/shared/ColorGradientModal";
import { BackgroundImageUpload } from "@/components/shared/BackgroundImageUpload";
import { arabicColorGradientCopy } from "@/components/shared/color-gradient-arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import type { BackgroundColorPickerProps } from "../BackgroundColorPicker";
import { editorDrawerCopy } from "../editor-drawer-copy";

export const LINKTREE_LIGHT_BACKGROUND = "#ffffff";
export { DEFAULT_LINKTREE_BACKGROUND_COLOR as LINKTREE_DARK_BACKGROUND } from "@linktree/types/linktree-defaults.cjs";
import { DEFAULT_LINKTREE_BACKGROUND_COLOR as LINKTREE_DARK_BACKGROUND } from "@linktree/types/linktree-defaults.cjs";
type Appearance = "light" | "dark" | "custom";

function appearanceForColor(value: string): Appearance {
  const color = value.trim().toLowerCase();
  if (color === LINKTREE_LIGHT_BACKGROUND || color === "#fff") return "light";
  if ([LINKTREE_DARK_BACKGROUND, "#000000", "#000"].includes(color)) return "dark";
  return "custom";
}

/** Page appearance is stored through the existing background color/image fields. */
type LinktreeAppearanceControlsProps = Pick<BackgroundColorPickerProps, "value" | "onChange" | "onBlur" | "allowGradient" | "colorCopy" | "error" | "imagePreview" | "imageLabel" | "imageRemoveLabel" | "onImageChange" | "onImageRemove" | "onImageCrop" | "cropLabel"> & { locale: BusinessLocale };

export function LinktreeAppearanceControls({ locale, onBlur, ...props }: LinktreeAppearanceControlsProps) {
  const copy = editorDrawerCopy(locale);
  const [customRequested, setCustomRequested] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const customColor = useRef<string | null>(appearanceForColor(props.value) === "custom" ? props.value : null);
  const appearance = customRequested || props.imagePreview ? "custom" : appearanceForColor(props.value);
  const closePopup = useCallback(() => {
    setPopupOpen(false);
    onBlur?.();
  }, [onBlur, setPopupOpen]);
  return (
    <div ref={anchor} className="min-w-0 space-y-2" data-bg-color-section dir={locale === "en" ? "ltr" : "rtl"}>
      <div>
        <CustomSelect<Appearance>
          hideLabel
          label={copy.theme}
          ariaLabel={copy.theme}
          value={appearance}
          options={[
            { value: "light", label: copy.light },
            { value: "dark", label: copy.dark },
            { value: "custom", label: copy.custom },
          ]}
          onChange={(next) => {
            if (appearance === "custom") customColor.current = props.value;
            setCustomRequested(next === "custom");
            if (next === "custom") {
              if (customColor.current) props.onChange(customColor.current);
              setPopupOpen(true);
            } else {
              setPopupOpen(false);
              props.onImageRemove?.();
              props.onChange(next === "light" ? LINKTREE_LIGHT_BACKGROUND : LINKTREE_DARK_BACKGROUND);
            }
          }}
          ariaInvalid={!!props.error}
          triggerClassName="!justify-center !text-xs"
        />
        {appearance === "custom" && <ColorGradientModal
          anchorRef={anchor}
          isOpen={popupOpen}
          value={props.value}
          onClose={closePopup}
          title={copy.customBackground}
          allowGradient={props.allowGradient}
          copy={props.colorCopy ?? (locale === "en" ? englishBusinessMessages.SettingsColorPicker : locale === "ar" ? arabicColorGradientCopy : undefined)}
          onChange={(value) => {
            customColor.current = value;
            props.onImageRemove?.();
            props.onChange(value);
          }}
          imageTab={props.onImageChange ? {
            label: copy.image,
            selected: !!props.imagePreview,
            content: <BackgroundImageUpload image={props.imagePreview} onChange={props.onImageChange} onRemove={props.onImageRemove}
              onCrop={props.onImageCrop ? (target) => { closePopup(); props.onImageCrop?.(anchor.current?.querySelector<HTMLElement>('[role="combobox"]') ?? target); } : undefined} cropLabel={props.cropLabel}
              label={props.imageLabel ?? copy.backgroundImage} removeLabel={props.imageRemoveLabel ?? copy.removeBackgroundImage} />,
          } : undefined}
        />}
      </div>
      {props.error && <p role="alert" className="text-xs text-red-500">{props.error}</p>}
    </div>
  );
}
