"use client";
import { useState, type ChangeEvent, type RefObject, type ComponentProps } from "react";
import { Upload, Trash2, Crop } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { EditorImageTile } from "./EditorImageTile";
import { EDITOR_IMAGE_ACTION_CLASS } from "./editor-control-styles";
import { FullscreenImageViewer } from "./FullscreenImageViewer";

/** A single native file picker with the same thumbnail/actions as Forms. */
export function EditorImageUpload({ image, fileInputRef, onChange, onChoose, onRemove, onCrop, cropLabel, hideRemove = false, label, removeLabel, error, previewLabels }: {
  image?: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onChoose?: () => void;
  onRemove: () => void;
  onCrop?: (returnFocus: HTMLElement) => void;
  cropLabel?: string;
  hideRemove?: boolean;
  label: string;
  removeLabel: string;
  error?: string;
  previewLabels?: ComponentProps<typeof FullscreenImageViewer>["labels"];
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const choose = () => onChoose ? onChoose() : fileInputRef.current?.click();
  return <div className="space-y-2">
    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={onChange} className="sr-only" aria-label={label} />
    <div className="flex flex-wrap items-center gap-3">
      <EditorImageTile src={image} label={`${label} 1`} onChoose={image && previewLabels ? () => setPreviewOpen(true) : choose}>
        {image && !hideRemove && <Tooltip content={removeLabel}><button type="button" onClick={onRemove} aria-label={removeLabel}
          className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-red-500"><Trash2 className="size-3" /></button></Tooltip>}
      </EditorImageTile>
      <div className="space-y-1">
      {image && onCrop && cropLabel && <Tooltip content={cropLabel}><button type="button" onClick={(event) => onCrop(event.currentTarget)} className={EDITOR_IMAGE_ACTION_CLASS}><Crop className="size-3.5" />{cropLabel}</button></Tooltip>}
      <Tooltip content={label}><button type="button" onClick={choose} className={EDITOR_IMAGE_ACTION_CLASS}>
        <Upload className="size-3.5" />{label}
      </button></Tooltip>
      </div>
    </div>
    {error && <p role="alert" className="text-xs font-medium text-red-500">{error}</p>}
    {previewOpen && image && previewLabels && <FullscreenImageViewer images={[image]} title={label} labels={previewLabels} onClose={() => setPreviewOpen(false)} />}
  </div>;
}
