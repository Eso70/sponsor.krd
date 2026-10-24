"use client";
import { ImageIcon, Images } from "lucide-react";
import type { ComponentProps } from "react";
import { SegmentedTabs } from "./SegmentedTabs";
import { EditorImagePicker } from "./EditorImagePicker";

/** Identical image/carousel controls for the Forms and Linktree banner sections. */
export function EditorBannerControls({ mode, onModeChange, ...picker }: ComponentProps<typeof EditorImagePicker> & {
  mode: "image" | "carousel";
  onModeChange: (mode: "image" | "carousel") => void;
}) {
  return <>
    <div role="tablist" aria-label={picker.labels?.banner} className="max-w-xs">
      <SegmentedTabs value={mode} tabs={[
        { id: "image", label: picker.labels?.image ?? "Image", icon: ImageIcon },
        { id: "carousel", label: picker.labels?.carousel ?? "Carousel", icon: Images },
      ]} onChange={onModeChange} fullWidth className="!rounded-2xl !border-transparent !shadow-none !bg-[var(--shared-control-surface)] !p-1 [&_button]:!h-8 [&_button]:!rounded-xl [&_button]:!text-xs" />
    </div>
    <EditorImagePicker {...picker} multiple={mode === "carousel"} variant="banner" />
  </>;
}
