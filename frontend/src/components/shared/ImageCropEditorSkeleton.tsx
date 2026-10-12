"use client";
import { createPortal } from "react-dom";
import { ImageCropControls } from "./ImageCropControls";
import { ModalFooterActions } from "./ModalFooterActions";
import { Skeleton } from "./Skeleton";
import type { ImageCropCopy } from "./image-crop-copy";

export function ImageCropCanvasSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className="absolute inset-0 flex items-center justify-center p-8"
    >
      <Skeleton className="h-2/3 w-full max-w-2xl rounded-none border border-white/50" />
    </div>
  );
}

/** Reserves the actual crop workspace while its code loads inside a drawer. */
export function ImageCropEditorSkeleton({
  copy,
  cancelLabel,
  onCancel,
  footerTarget,
}: {
  copy: ImageCropCopy;
  cancelLabel: string;
  onCancel?: () => void;
  footerTarget?: HTMLElement | null;
}) {
  const footer = (
    <div className="flex w-full items-center justify-end gap-2" dir="ltr">
      <ModalFooterActions
        compact
        submitLabel={copy.confirm}
        submittingLabel={copy.confirm}
        cancelLabel={cancelLabel}
        submitDisabled
        showCancel={!!onCancel}
        onCancel={() => onCancel?.()}
        onSubmit={() => undefined}
      />
    </div>
  );
  return (
    <section
      role="status"
      aria-label={copy.title}
      aria-busy="true"
      data-crop-skeleton
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled
          className="h-10 w-52 rounded-xl border border-slate-200 px-3 text-start text-sm dark:border-white/10"
        >
          {copy.free}
        </button>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" disabled />
          {copy.blur}
        </label>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(0,1fr)_200px] dark:border-white/10 dark:bg-slate-900/20">
        <div className="min-w-0 bg-slate-200 dark:bg-slate-800">
          <div className="relative aspect-square sm:aspect-[4/3]">
            <ImageCropCanvasSkeleton label={copy.title} />
          </div>
          <ImageCropControls
            copy={copy}
            disabled
            canZoomIn={false}
            canZoomOut={false}
            onReset={() => undefined}
            onZoomIn={() => undefined}
            onZoomOut={() => undefined}
          />
        </div>
        <aside className="space-y-6 bg-slate-50 p-5 text-xs dark:bg-white/[0.02]">
          <p>{copy.preview}</p>
          <Skeleton className="h-24 w-full" />
          <p>{copy.specifications}</p>
          <Skeleton className="h-4 w-24" />
        </aside>
      </div>
      {footerTarget ? createPortal(footer, footerTarget) : footer}
    </section>
  );
}
