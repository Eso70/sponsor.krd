"use client";
import { useCallback, useState } from "react";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";

export function useEditorImageCrop() {
  const [cropRequest, setCropRequest] = useState<EditorImageCropRequest | null>(null);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropFooter, setCropFooter] = useState<HTMLDivElement | null>(null);
  const cancelCrop = useCallback(() => {
    const target = cropRequest?.returnFocus;
    setCropRequest(null);
    requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  }, [cropRequest]);
  return { cropRequest, setCropRequest, cropBusy, setCropBusy, cropFooter, setCropFooter, cancelCrop };
}
