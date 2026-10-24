"use client";
import type { ComponentProps } from "react";
import { EditorImagePicker } from "@/components/shared/EditorImagePicker";
import { useFormValidation } from "./FormValidationContext";
import { useFormImageCrop } from "./FormImageCropContext";
export function FormImagePicker(props: ComponentProps<typeof EditorImagePicker>) {
  return <EditorImagePicker {...props} validation={useFormValidation()} requestCrop={useFormImageCrop()} />;
}
