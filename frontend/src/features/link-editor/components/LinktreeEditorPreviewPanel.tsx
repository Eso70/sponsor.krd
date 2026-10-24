"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { LinktreeEditorPreviewDraft } from "../editor-preview";
import { LinktreeAppearanceControls } from "./LinktreeAppearanceControls";
import { LinktreeEditorPreviewSkeleton } from "./LinktreeEditorLoadingContent";
import { LinktreeDesignControls } from "./LinktreeDesignControls";
import type { LinktreeWhatsAppPreview } from "./LinktreeEditorPreview";

const LinktreeEditorPreview = dynamic(() => import("./LinktreeEditorPreview").then((module) => module.LinktreeEditorPreview));

export function LinktreeEditorPreviewPanel({ draft, label, designControls, whatsappPreview, ...controls }: ComponentProps<typeof LinktreeAppearanceControls> & {
  draft: LinktreeEditorPreviewDraft;
  label: string;
  designControls: ComponentProps<typeof LinktreeDesignControls>;
  whatsappPreview?: LinktreeWhatsAppPreview;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <LinktreeDesignControls {...designControls} />
        <LinktreeAppearanceControls {...controls} />
      </div>
      <Suspense fallback={<LinktreeEditorPreviewSkeleton label={label} />}>
        <LinktreeEditorPreview draft={draft} locale={controls.locale} label={label} whatsappPreview={whatsappPreview} />
      </Suspense>
    </div>
  );
}
