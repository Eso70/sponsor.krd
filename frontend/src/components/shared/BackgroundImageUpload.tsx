"use client";
import { ImagePlus, X } from "lucide-react";
import { useRef, type ChangeEventHandler } from "react";
import { EditorImageUpload } from "./EditorImageUpload";
import { Tooltip } from "./Tooltip";

/** Parent-validated image selection shared by compact swatches and editor popups. */
export function BackgroundImageUpload({ image, onChange, onRemove, label, removeLabel, onCrop, cropLabel, compact = false }: {
  image?: string | null;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onRemove?: () => void;
  label: string;
  removeLabel: string;
  compact?: boolean;
  onCrop?: (returnFocus: HTMLElement) => void;
  cropLabel?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  if (!compact) return <EditorImageUpload image={image} fileInputRef={fileInput} onChange={onChange} onRemove={() => onRemove?.()} hideRemove={!onRemove} label={label} removeLabel={removeLabel} onCrop={onCrop} cropLabel={cropLabel} />;
  return <div className="flex flex-col items-center gap-0.5">
    <div className="relative">
      <Tooltip content={label} side="top">
        <label className={`relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 transition-all ${image ? "theme-soft border-transparent scale-110 shadow-sm" : "border-gray-300 hover:border-gray-400 hover:scale-105"}`}>
          {image ? (
            // Local data previews and owner upload paths bypass image optimization.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : <ImagePlus aria-hidden className="size-3.5 text-gray-500" />}
          <input aria-label={label} type="file" accept="image/png,image/jpeg" onChange={onChange} className="hidden" />
        </label>
      </Tooltip>
      {image && onRemove && <Tooltip content={removeLabel} side="top">
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="absolute -right-1.5 -top-1.5 z-20 flex size-3.5 items-center justify-center rounded-full bg-gray-700 text-white shadow-sm hover:bg-gray-900"><X aria-hidden className="size-2.5" /></button>
      </Tooltip>}
    </div>
    <span className="w-7 truncate text-center text-[8px] leading-tight text-gray-500">{label}</span>
  </div>;
}
