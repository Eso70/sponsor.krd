"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FullscreenImageViewer } from "./FullscreenImageViewer";
import { ImageCropCanvasSkeleton } from "./ImageCropEditorSkeleton";
import { createPortal } from "react-dom";
import { CustomSelect } from "./CustomSelect";
import { ImageCropHandles } from "./ImageCropHandles";
import {
  moveCropFrame,
  resizeCropFrame,
  reframeCrop,
  type CropFrame,
  type CropEdge,
} from "@/lib/images/crop-selection";
import { ModalFooterActions } from "./ModalFooterActions";
import { ImageCropControls } from "./ImageCropControls";
import { ImageCropPreviewPanel } from "./ImageCropPreviewPanel";
import { VisibilitySwitch } from "./VisibilitySwitch";
import type { ImageCropCopy } from "./image-crop-copy";
import {
  INITIAL_CROP,
  MAX_CROP_ZOOM,
  cropGeometry,
  cropOutputSize,
  drawImageCrop,
  exportImageCrop,
  loadCropImage,
  type CropTransform,
} from "@/lib/images/image-crop";

/** Inline crop workspace with draggable/resizable selection and validated raster output. */
export type ImageCropAspect =
  "original" | "free" | "square" | "wide" | "standard" | "portrait";

export function ImageCropEditor({
  src,
  aspect = "free",
  maxEdge = 1440,
  copy,
  cancelLabel,
  onClose,
  onConfirm,
  onBusyChange,
  footerTarget,
}: {
  src: string;
  aspect?: ImageCropAspect;
  maxEdge?: number;
  copy: ImageCropCopy;
  cancelLabel: string;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
  /** undefined keeps an inline footer; null waits for the drawer footer to mount. */
  footerTarget?: HTMLElement | null;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedAspect, setSelectedAspect] = useState(aspect);
  const [transform, setTransform] = useState<CropTransform>(INITIAL_CROP);
  const [fill, setFill] = useState(false);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState({ width: 640, height: 440 });
  const [selection, setSelection] = useState<{
    cx: number;
    cy: number;
    width: number;
    ratio: number;
  } | null>(null);
  const cropDrag = useRef<{
    edge?: CropEdge;
    x: number;
    y: number;
    frame: CropFrame;
    transform: CropTransform;
  } | null>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const mounted = useRef(true);
  const saving = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const ratio =
    selectedAspect === "square"
      ? 1
      : selectedAspect === "wide"
        ? 16 / 9
        : selectedAspect === "standard"
          ? 4 / 3
          : selectedAspect === "portrait"
            ? 9 / 16
            : selectedAspect === "free" && selection
              ? selection.ratio
              : image
                ? image.naturalWidth / image.naturalHeight
                : 1;
  const frame = useMemo(() => {
    const width = Math.min(
      size.width * (selection?.width ?? 0.8),
      size.width,
      size.height * (selection ? 1 : 0.8) * ratio,
    );
    const height = width / ratio;
    const left = Math.max(
      0,
      Math.min(
        size.width - width,
        (selection?.cx ?? 0.5) * size.width - width / 2,
      ),
    );
    const top = Math.max(
      0,
      Math.min(
        size.height - height,
        (selection?.cy ?? 0.5) * size.height - height / 2,
      ),
    );
    return { width, height, left, top };
  }, [size.width, size.height, ratio, selection]);
  const geometry = image
    ? cropGeometry(
        { width: image.naturalWidth, height: image.naturalHeight },
        frame,
        transform,
        fill,
      )
    : null;

  useEffect(() => {
    mounted.current = true;
    let active = true;
    loadCropImage(src)
      .then((loaded) => {
        if (active) setImage(loaded);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [src]);
  useEffect(() => {
    const canvas = stage.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height)
        setSize({ width: rect.width, height: rect.height });
    };
    resize();
    canvas.focus({ preventScroll: true });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!image || !stage.current || !preview.current) return;
    const canvas = stage.current;
    canvas.width = Math.round(size.width * devicePixelRatio);
    canvas.height = Math.round(size.height * devicePixelRatio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(devicePixelRatio, devicePixelRatio);
    const { left, top } = frame;
    const current = cropGeometry(
      { width: image.naturalWidth, height: image.naturalHeight },
      frame,
      transform,
      fill,
    );
    context.drawImage(
      image,
      left + current.left,
      top + current.top,
      current.width,
      current.height,
    );
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(0, 0, size.width, top);
    context.fillRect(0, top + frame.height, size.width, size.height);
    context.fillRect(0, top, left, frame.height);
    context.fillRect(left + frame.width, top, size.width, frame.height);
    const cropCanvas = preview.current;
    const output = cropOutputSize(ratio, 240);
    cropCanvas.width = output.width;
    cropCanvas.height = output.height;
    const cropContext = cropCanvas.getContext("2d");
    if (cropContext) {
      drawImageCrop(cropContext, image, output, transform, fill);
    }
    context.save();
    context.translate(left, top);
    context.beginPath();
    context.rect(0, 0, frame.width, frame.height);
    context.clip();
    drawImageCrop(context, image, frame, transform, fill);
    context.restore();
    context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    context.lineWidth = 1;
    for (const part of [1 / 3, 2 / 3]) {
      context.beginPath();
      context.moveTo(left + frame.width * part, top);
      context.lineTo(left + frame.width * part, top + frame.height);
      context.moveTo(left, top + frame.height * part);
      context.lineTo(left + frame.width, top + frame.height * part);
      context.stroke();
    }
    context.strokeStyle = "white";
    context.strokeRect(left, top, frame.width, frame.height);
  }, [image, size, frame, ratio, transform, fill]);

  const update = (
    next: CropTransform | ((previous: CropTransform) => CropTransform),
  ) => {
    if (!image || busy) return;
    setTransform(
      (previous) =>
        cropGeometry(
          { width: image.naturalWidth, height: image.naturalHeight },
          frame,
          typeof next === "function" ? next(previous) : next,
          fill,
        ).transform,
    );
  };
  const reset = () => {
    setTransform(INITIAL_CROP);
    setSelection(null);
    pointers.current.clear();
    cropDrag.current = null;
  };
  const applyFrame = (
    next: CropFrame,
    previous = frame,
    previousTransform = transform,
  ) => {
    if (!image || busy) return;
    setTransform(
      reframeCrop(
        { width: image.naturalWidth, height: image.naturalHeight },
        previous,
        next,
        previousTransform,
        fill,
      ),
    );
    setSelection({
      cx: (next.left + next.width / 2) / size.width,
      cy: (next.top + next.height / 2) / size.height,
      width: next.width / size.width,
      ratio: next.width / next.height,
    });
  };
  const dragFrame = (x: number, y: number) => {
    const drag = cropDrag.current;
    if (!drag) return;
    const next = drag.edge
      ? resizeCropFrame(
          drag.frame,
          drag.edge,
          x - drag.x,
          y - drag.y,
          size,
          selectedAspect === "free" ? undefined : ratio,
        )
      : moveCropFrame(drag.frame, x - drag.x, y - drag.y, size);
    applyFrame(next, drag.frame, drag.transform);
  };
  const confirm = async () => {
    if (!image || saving.current) return;
    saving.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError(false);
    try {
      const file = await exportImageCrop(
        image,
        ratio,
        transform,
        fill,
        maxEdge,
      );
      if (mounted.current) await onConfirm(file);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      saving.current = false;
      onBusyChange?.(false);
      if (mounted.current) setBusy(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-end gap-2" dir="ltr">
      <ModalFooterActions
        compact
        submitLabel={copy.confirm}
        submittingLabel={copy.confirm}
        cancelLabel={cancelLabel}
        submitDisabled={!image}
        isSubmitting={busy}
        onCancel={onClose}
        onSubmit={() => void confirm()}
      />
    </div>
  );
  return (
    <section role="region" aria-label={copy.title} className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-52">
            <CustomSelect
              value={selectedAspect}
              label={copy.title}
              ariaLabel={copy.title}
              hideLabel
              disabled={busy}
              options={(
                [
                  "free",
                  "original",
                  "square",
                  "standard",
                  "wide",
                  "portrait",
                ] as const
              ).map((value) => ({ value, label: copy[value] }))}
              onChange={(value) => {
                if (value === "free") {
                  setSelection({
                    cx: (frame.left + frame.width / 2) / size.width,
                    cy: (frame.top + frame.height / 2) / size.height,
                    width: frame.width / size.width,
                    ratio: frame.width / frame.height,
                  });
                  setSelectedAspect(value);
                  return;
                }
                setSelectedAspect(value);
                reset();
              }}
            />
          </div>
          <fieldset
            disabled={busy}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
          >
            <VisibilitySwitch
              compact
              checked={fill}
              label={copy.blur}
              onChange={(value) => {
                setFill(value);
              }}
            />
            {copy.blur}
          </fieldset>
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(0,1fr)_200px] dark:border-white/10 dark:bg-slate-900/20">
          <div
            className="min-w-0 overflow-hidden bg-slate-200 dark:bg-slate-800"
            style={{
              backgroundImage:
                "conic-gradient(#64748b55 25%, transparent 0 50%, #64748b55 0 75%, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          >
            <div className="relative overflow-hidden">
              <canvas
                ref={stage}
                role="img"
                aria-label={copy.hint}
                tabIndex={0}
                className="block h-[min(44dvh,420px)] min-h-64 w-full touch-none cursor-grab focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 active:cursor-grabbing md:h-[min(62dvh,640px)]"
                onPointerDown={(event) => {
                  if (!image || busy) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pointers.current.set(event.pointerId, {
                    x: event.clientX,
                    y: event.clientY,
                  });
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - rect.left,
                    y = event.clientY - rect.top;
                  if (
                    pointers.current.size === 1 &&
                    x >= frame.left &&
                    x <= frame.left + frame.width &&
                    y >= frame.top &&
                    y <= frame.top + frame.height
                  )
                    cropDrag.current = {
                      x: event.clientX,
                      y: event.clientY,
                      frame,
                      transform,
                    };
                  else cropDrag.current = null;
                }}
                onPointerMove={(event) => {
                  const previous = pointers.current.get(event.pointerId);
                  if (!previous || !geometry) return;
                  const other = Array.from(pointers.current.entries()).find(
                    ([id]) => id !== event.pointerId,
                  )?.[1];
                  const current = { x: event.clientX, y: event.clientY };
                  if (cropDrag.current && !other)
                    dragFrame(current.x, current.y);
                  else if (other) {
                    const before = Math.hypot(
                      previous.x - other.x,
                      previous.y - other.y,
                    );
                    const after = Math.hypot(
                      current.x - other.x,
                      current.y - other.y,
                    );
                    if (before > 0)
                      update((crop) => ({
                        ...crop,
                        zoom: (crop.zoom * after) / before,
                      }));
                  } else
                    update((crop) => ({
                      ...crop,
                      x: crop.x + (current.x - previous.x) / frame.width,
                      y: crop.y + (current.y - previous.y) / frame.height,
                    }));
                  pointers.current.set(event.pointerId, current);
                }}
                onPointerUp={(event) => {
                  pointers.current.delete(event.pointerId);
                  cropDrag.current = null;
                }}
                onPointerCancel={(event) => {
                  pointers.current.delete(event.pointerId);
                  cropDrag.current = null;
                }}
                onLostPointerCapture={(event) => {
                  pointers.current.delete(event.pointerId);
                  cropDrag.current = null;
                }}
                onKeyDown={(event) => {
                  if (
                    !geometry ||
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(event.key)
                  )
                    return;
                  event.preventDefault();
                  const step = event.shiftKey ? 16 : 4;
                  applyFrame(
                    moveCropFrame(
                      frame,
                      event.key === "ArrowLeft"
                        ? -step
                        : event.key === "ArrowRight"
                          ? step
                          : 0,
                      event.key === "ArrowUp"
                        ? -step
                        : event.key === "ArrowDown"
                          ? step
                          : 0,
                      size,
                    ),
                  );
                }}
              />
              {image && (
                <ImageCropHandles
                  frame={frame}
                  label={copy.resize}
                  disabled={busy}
                  onStart={(edge, x, y) => {
                    cropDrag.current = { edge, x, y, frame, transform };
                  }}
                  onMove={dragFrame}
                  onEnd={() => {
                    cropDrag.current = null;
                  }}
                  onKeyResize={(edge, dx, dy) =>
                    applyFrame(
                      resizeCropFrame(
                        frame,
                        edge,
                        dx,
                        dy,
                        size,
                        selectedAspect === "free" ? undefined : ratio,
                      ),
                    )
                  }
                />
              )}
              {!image && !error && (
                <ImageCropCanvasSkeleton label={copy.title} />
              )}
            </div>
            <ImageCropControls
              copy={copy}
              disabled={!image || busy}
              canZoomIn={!!geometry && geometry.transform.zoom < MAX_CROP_ZOOM}
              canZoomOut={
                !!geometry && geometry.transform.zoom > geometry.minZoom
              }
              onReset={reset}
              onZoomIn={() =>
                geometry &&
                update({
                  ...geometry.transform,
                  zoom: geometry.transform.zoom + 0.1,
                })
              }
              onZoomOut={() =>
                geometry &&
                update({
                  ...geometry.transform,
                  zoom: geometry.transform.zoom - 0.1,
                })
              }
            />
          </div>
          <ImageCropPreviewPanel
            canvasRef={preview}
            copy={copy}
            width={cropOutputSize(ratio, maxEdge).width}
            height={cropOutputSize(ratio, maxEdge).height}
            disabled={!image || busy}
            onPreview={() => {
              if (!image || busy) return;
              try {
                const canvas = document.createElement("canvas");
                const output = cropOutputSize(ratio, maxEdge);
                canvas.width = output.width;
                canvas.height = output.height;
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas unavailable");
                drawImageCrop(context, image, output, transform, fill);
                setPreviewSource(canvas.toDataURL("image/png"));
              } catch {
                setError(true);
              }
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
            {copy.error}
          </p>
        )}
      </div>
      {footerTarget === undefined
        ? footer
        : footerTarget
          ? createPortal(footer, footerTarget)
          : null}
      {previewSource && (
        <FullscreenImageViewer
          images={[previewSource]}
          title={copy.preview}
          labels={copy}
          onClose={() => setPreviewSource(null)}
        />
      )}
    </section>
  );
}
