"use client";
import { createContext, useContext } from "react";
import type { FormEditorIssue } from "../form-editor-validation";

export const FormValidationContext = createContext<{
  issues: FormEditorIssue[];
  attempted: boolean;
  failedImage?: { image: string; message: string } | null;
  selected: FormEditorIssue | null;
  select: (issue: FormEditorIssue | null) => void;
}>({ issues: [], attempted: false, selected: null, select: () => undefined });

export const useFormValidation = () => useContext(FormValidationContext);
