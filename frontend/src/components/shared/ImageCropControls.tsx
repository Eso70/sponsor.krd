"use client";

import { SHARED_CONTROL_CLASS } from "./shared-control-styles";

import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { IconActionButton } from "./IconActionButton";
import type { ImageCropCopy } from "./image-crop-copy";

export function ImageCropControls({
  copy,
  disabled,
  canZoomIn,
  canZoomOut,
  onReset,
  onZoomIn,
  onZoomOut,
}: {
  copy: ImageCropCopy;
  disabled: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onReset}
        className={`${SHARED_SOFT_BUTTON_CLASS} flex h-10 items-center gap-2 px-3 text-xs font-semibold disabled:opacity-40`}
      >
        <RotateCcw className="size-4" />
        {copy.reset}
      </button>
      <div className={`${SHARED_CONTROL_CLASS} flex h-10 items-center gap-2 px-2`}>
        <IconActionButton
          label={copy.zoomIn}
          tone="surface"
          disabled={disabled || !canZoomIn}
          onClick={onZoomIn}
        >
          <ZoomIn className="size-4" />
        </IconActionButton>
        <IconActionButton
          label={copy.zoomOut}
          tone="surface"
          disabled={disabled || !canZoomOut}
          onClick={onZoomOut}
        >
          <ZoomOut className="size-4" />
        </IconActionButton>
      </div>
    </div>
  );
}
