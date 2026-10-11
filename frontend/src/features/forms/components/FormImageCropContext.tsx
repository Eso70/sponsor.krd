"use client";
import { createContext, useContext } from "react";
import type { ImageCropAspect } from "@/components/shared/ImageCropEditor";

export type FormImageCropRequest = {
  src: string;
  aspect: ImageCropAspect;
  maxEdge: number;
  onConfirm: (file: File) => Promise<void>;
  returnFocus?: HTMLElement;
};
export const FormImageCropContext = createContext<
  ((request: FormImageCropRequest) => void) | null
>(null);
export const useFormImageCrop = () => useContext(FormImageCropContext);
