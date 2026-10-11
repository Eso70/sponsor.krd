"use client";

import type { RefObject } from "react";
import type { ImageCropCopy } from "./image-crop-copy";

export function ImageCropPreviewPanel({
  canvasRef,
  copy,
  width,
  height,
  disabled,
  onPreview,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  copy: ImageCropCopy;
  width: number;
  height: number;
  disabled: boolean;
  onPreview: () => void;
}) {
  return (
    <aside className="grid grid-cols-[112px_minmax(0,1fr)] gap-5 border-t border-slate-200 bg-slate-50 p-4 md:flex md:flex-col md:gap-6 md:border-s md:border-t-0 md:p-5 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {copy.preview}
        </p>
        <button
          type="button"
          aria-label={copy.preview}
          disabled={disabled}
          onClick={onPreview}
          className="block w-full rounded-lg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-50"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={copy.preview}
            className="block max-h-40 w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-white/10 dark:bg-slate-800"
          />
        </button>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {copy.specifications}
          </p>
          <p
            className="text-xs tabular-nums text-slate-500 dark:text-slate-400"
            dir="ltr"
          >
            {width} × {height} px
          </p>
        </div>
      </div>
    </aside>
  );
}
