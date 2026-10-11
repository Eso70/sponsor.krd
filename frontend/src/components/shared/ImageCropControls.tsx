"use client";

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
        className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <RotateCcw className="size-4" />
        {copy.reset}
      </button>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 shadow-sm dark:border-white/10 dark:bg-slate-800">
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
