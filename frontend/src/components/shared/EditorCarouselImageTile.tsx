"use client";
import Image from "next/image";
import { Crop, Trash2, Upload } from "lucide-react";
import { IconActionButton } from "./IconActionButton";
import { useReorderGesture } from "@/hooks/useReorderGesture";
import styles from "./EditorCarouselImageTile.module.css";

/** Unobstructed sortable image, with its editing actions beneath it. */
export function EditorCarouselImageTile({ src, id, group, label, disabled, reorderEnabled, onChoose, onUpdate, onRemove, onCrop, updateLabel, removeLabel, cropLabel, onReorder, onStep }: {
  src: string; id: string; group: string; label: string; disabled: boolean;
  reorderEnabled: boolean;
  onChoose: () => void; onUpdate: () => void; onRemove: () => void; onCrop: () => void;
  updateLabel: string; removeLabel: string; cropLabel: string;
  onReorder: (source: string, target: string) => void; onStep: (offset: number) => void;
}) {
  const gesture = useReorderGesture({ id, group, disabled: disabled || !reorderEnabled, onReorder, onStep, holdDelay: 250 });
  return <div data-reorder-id={id} data-reorder-group={group} data-reorder-thumbnail className={`${styles.tile} w-20 space-y-1.5`}>
    <button type="button" disabled={disabled} aria-label={label} draggable={false}
      {...gesture} onClick={(event) => { gesture.onClick(event); if (!event.defaultPrevented) onChoose(); }}
      onContextMenu={(event) => event.preventDefault()}
      className={`${styles.image} relative block size-20 select-none overflow-hidden rounded-2xl bg-[var(--shared-control-surface)] disabled:opacity-50 ${reorderEnabled ? "touch-none cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}>
      <Image unoptimized src={src} alt="" fill draggable={false} className="pointer-events-none object-cover" />
    </button>
    <div className="flex items-center justify-center gap-0.5">
      <IconActionButton label={updateLabel} disabled={disabled} onClick={onUpdate}><Upload aria-hidden className="size-3.5" /></IconActionButton>
      <IconActionButton label={cropLabel} disabled={disabled} onClick={onCrop}><Crop aria-hidden className="size-3.5" /></IconActionButton>
      <IconActionButton label={removeLabel} disabled={disabled} tone="danger" onClick={onRemove}><Trash2 aria-hidden className="size-3.5" /></IconActionButton>
    </div>
  </div>;
}
