"use client";

import { useState, type CSSProperties } from "react";
import { ImagePlus, X } from "lucide-react";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { ColorGradientModal, type ColorGradientModalProps } from "@/components/shared/ColorGradientModal";
import { Tooltip } from "@/components/shared/Tooltip";

import { RAINBOW_BACKGROUND_COLORS, type BackgroundColorOption } from "@/lib/utils/color-palettes";
export { RAINBOW_BACKGROUND_COLORS, type BackgroundColorOption } from "@/lib/utils/color-palettes";

interface BackgroundColorPickerProps {
  customLabel?: string;
  imageLabel?: string;
  imageRemoveLabel?: string;
  colorNames?: Record<string, string>;
  colorCopy?: ColorGradientModalProps["copy"];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  allowGradient?: boolean;
  showCustom?: boolean;
  colors?: readonly BackgroundColorOption[];
  error?: string;
  /**
   * A background image replaces the colour surface entirely. The image tile is
   * only rendered for surfaces that accept one, so a picker without
   * `onImageChange` keeps its colours-only row.
   */
  imagePreview?: string | null;
  onImageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove?: () => void;
}

const IMAGE_TILE_LABEL = "وێنەی باکگڕاوند";
const IMAGE_REMOVE_LABEL = "لابردنی وێنەی باکگڕاوند";

/**
 * The swatch reads the gradient through `parseWebsiteColor`, never its own
 * direction table. A local table here only listed four of the nine directions
 * and emitted `linear-gradient(, …)` — invalid CSS, so choosing `to-t`, `to-l`,
 * `to-tr`, or `to-tl` blanked the swatch and read as "the direction did
 * nothing".
 */
function customSwatchStyle(value: string): CSSProperties {
  if (value.startsWith("gradient:")) {
    return { background: parseWebsiteColor(value).css };
  }
  return {
    background: "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
  };
}

export function BackgroundColorPicker({
  customLabel = "ئارەزوومەندانەیە",
  imageLabel = IMAGE_TILE_LABEL,
  imageRemoveLabel = IMAGE_REMOVE_LABEL,
  colorNames,
  colorCopy,
  value,
  onChange,
  onBlur,
  allowGradient = true,
  showCustom = true,
  colors = RAINBOW_BACKGROUND_COLORS,
  error,
  imagePreview,
  onImageChange,
  onImageRemove,
}: BackgroundColorPickerProps) {
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const hasImage = !!imagePreview;
  // An image overrides every colour, so no swatch reads as selected while one
  // is set.
  const isCustom =
    !hasImage &&
    (value.startsWith("gradient:") ||
      (value.startsWith("#") && !colors.some((color) => color.value === value)));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {showCustom && (
          <div className="flex flex-col items-center gap-0.5">
            <Tooltip content={customLabel} side="top">
              <button
                type="button"
                onClick={() => setShowGradientPicker(true)}
                className={`relative h-6 w-6 overflow-hidden rounded-md border-2 transition-all duration-200 cursor-pointer ${
                  isCustom
                    ? "theme-soft border-transparent scale-110 shadow-sm z-10"
                    : "border-gray-300 hover:border-gray-400 hover:scale-105"
                }`}
                title={customLabel}
                aria-label={customLabel}
              >
                <span className="absolute inset-0" style={customSwatchStyle(value)} />
              </button>
            </Tooltip>
            <span className="text-[8px] text-gray-500 leading-tight text-center w-7 truncate">{customLabel}</span>
          </div>
        )}

        {onImageChange && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
              <Tooltip content={imageLabel} side="top">
                <label
                  className={`relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 transition-all duration-200 ${
                    hasImage
                      ? "theme-soft border-transparent scale-110 shadow-sm z-10"
                      : "border-gray-300 hover:border-gray-400 hover:scale-105"
                  }`}
                >
                  {imagePreview ? (
                    // A data URL preview and an uploaded path both render here, so
                    // the optimizer is bypassed.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5 text-gray-500" />
                  )}
                  <input
                    aria-label={imageLabel}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onImageChange}
                    className="hidden"
                  />
                </label>
              </Tooltip>
              {hasImage && onImageRemove && (
                <Tooltip content={imageRemoveLabel} side="top">
                  <button
                    type="button"
                    onClick={onImageRemove}
                    aria-label={imageRemoveLabel}
                    className="absolute -right-1.5 -top-1.5 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-700 text-white shadow-sm transition hover:bg-gray-900 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Tooltip>
              )}
            </div>
            <span className="text-[8px] text-gray-500 leading-tight text-center w-7 truncate">{imageLabel}</span>
          </div>
        )}

        {colors.map((color) => (
          <div key={color.id} className="flex flex-col items-center gap-0.5">
            <Tooltip content={colorNames?.[color.id] ?? color.name} side="top">
              <button
                type="button"
                onClick={() => {
                  // Choosing a colour drops the image, because the image is the
                  // background instead of the colour rather than on top of it.
                  onImageRemove?.();
                  onChange(color.value);
                  setShowGradientPicker(false);
                }}
                onBlur={onBlur}
                className={`relative h-6 w-6 overflow-hidden rounded-md border-2 transition-all duration-200 cursor-pointer ${
                  !hasImage && value === color.value
                    ? "theme-soft border-transparent scale-110 shadow-sm z-10"
                    : "border-gray-300 hover:border-gray-400 hover:scale-105"
                }`}
                title={colorNames?.[color.id] ?? color.name}
                aria-label={colorNames?.[color.id] ?? color.name}
              >
                {color.isSolid ? (
                  <span className="absolute inset-0 transition-opacity duration-200" style={{ backgroundColor: color.value }} />
                ) : (
                  <span className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-200 ${color.gradient}`} />
                )}
                {!hasImage && value === color.value && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </span>
                )}
              </button>
            </Tooltip>
            <span className="text-[8px] text-gray-500 leading-tight text-center w-7 truncate">{colorNames?.[color.id] ?? color.name}</span>
          </div>
        ))}
      </div>

      {showCustom && (
        <ColorGradientModal
          copy={colorCopy}
          isOpen={showGradientPicker}
          value={value}
          onChange={(next) => {
            onImageRemove?.();
            onChange(next);
          }}
          onClose={() => setShowGradientPicker(false)}
          solidFallback="#ff0000"
          gradientFallback="#0066ff"
          allowGradient={allowGradient}
        />
      )}

      {error && <p className="text-xs text-red-500 mt-1 font-kurdish">{error}</p>}
    </>
  );
}
