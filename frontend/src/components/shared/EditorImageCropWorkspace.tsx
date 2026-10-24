"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ImageCropEditorSkeleton } from "./ImageCropEditorSkeleton";
import type { ImageCropCopy } from "./image-crop-copy";
import type { ImageCropAspect } from "./ImageCropEditor";

export type EditorImageCropRequest = {
  src: string;
  aspect: ImageCropAspect;
  maxEdge: number;
  allowWebp?: boolean;
  onConfirm: (file: File) => Promise<void>;
  returnFocus?: HTMLElement;
};
const ImageCropEditor = dynamic(() => import("./ImageCropEditor").then((module) => module.ImageCropEditor));

/** One inline crop workspace and matching loading UI for both page editors. */
export function EditorImageCropWorkspace({ request, copy, cancelLabel, onCancel, onBusyChange, footerTarget, onApplied }: {
  request: EditorImageCropRequest;
  copy: ImageCropCopy;
  cancelLabel: string;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
  footerTarget: HTMLElement | null;
  onApplied?: () => void;
}) {
  return <div className="h-full overflow-y-auto pb-2">
    <Suspense fallback={<ImageCropEditorSkeleton copy={copy} cancelLabel={cancelLabel} onCancel={onCancel} footerTarget={footerTarget} />}>
      <ImageCropEditor src={request.src} aspect={request.aspect} maxEdge={request.maxEdge} allowWebp={request.allowWebp}
        copy={copy} cancelLabel={cancelLabel} onClose={onCancel} onBusyChange={onBusyChange} footerTarget={footerTarget}
        onConfirm={async (file) => { await request.onConfirm(file); onApplied?.(); onCancel(); }} />
    </Suspense>
  </div>;
}
