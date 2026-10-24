"use client";
import { createContext, useContext } from "react";
import type { EditorImageCropRequest } from "@/components/shared/EditorImageCropWorkspace";
export type FormImageCropRequest = EditorImageCropRequest;
export const FormImageCropContext = createContext<
  ((request: FormImageCropRequest) => void) | null
>(null);
export const useFormImageCrop = () => useContext(FormImageCropContext);
