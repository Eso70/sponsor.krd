"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormEditorCopy } from "../form-editor-copy";

/** Shared preview browsing controls, separate from the form's submit navigation. */
export function FormPreviewNavigation({
  currentIndex,
  pageCount,
  onPrevious,
  onNext,
  labels,
}: {
  currentIndex: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  labels: FormEditorCopy;
}) {
  return (
    <nav
      aria-label={labels.previewPages}
      dir="ltr"
      className="flex shrink-0 items-center justify-center gap-2 pb-2"
    >
      <IconActionButton
        label={labels.previousPreviewPage}
        disabled={currentIndex <= 0}
        onClick={onPrevious}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </IconActionButton>
      <IconActionButton
        label={labels.nextPreviewPage}
        disabled={currentIndex >= pageCount - 1}
        onClick={onNext}
      >
        <ChevronRight aria-hidden className="size-4" />
      </IconActionButton>
    </nav>
  );
}
