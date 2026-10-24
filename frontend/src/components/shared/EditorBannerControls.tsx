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
    <div className="max-w-xs">
      <SegmentedTabs compact label={picker.labels?.banner} value={mode} tabs={[
        { id: "image", label: picker.labels?.image ?? "Image", icon: ImageIcon },
        { id: "carousel", label: picker.labels?.carousel ?? "Carousel", icon: Images },
      ]} onChange={onModeChange} fullWidth />
    </div>
    <EditorImagePicker {...picker} multiple={mode === "carousel"} variant="banner" />
  </>;
}
