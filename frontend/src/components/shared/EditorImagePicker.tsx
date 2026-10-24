"use client";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";
import { toast } from "sonner";
import { Tooltip } from "@/components/shared/Tooltip";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, ImageIcon, Plus, Upload, Eye, Crop } from "lucide-react";
import dynamic from "next/dynamic";
import { ImageCropEditorSkeleton } from "@/components/shared/ImageCropEditorSkeleton";
import { FullscreenImageViewer } from "./FullscreenImageViewer";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { EditorImageTile } from "@/components/shared/EditorImageTile";
import { EDITOR_IMAGE_ACTION_CLASS } from "@/components/shared/editor-control-styles";
import { EditorField } from "@/components/shared/EditorField";
import { isFormImage, readFormImage } from "@/features/forms/form-media";
import type { FormsCopy } from "@/features/forms/forms-copy";
import type { FormEditorCopy } from "@/features/forms/form-editor-copy";
import type { EditorImageCropRequest } from "./EditorImageCropWorkspace";
import { EditorCarouselImageTile } from "./EditorCarouselImageTile";
import { useImageEntries } from "@/hooks/useImageEntries";
import { reorderItems } from "@/lib/utils/reorder-items";
import { useEditorMediaActivity } from "./EditorMediaActivity";

const ImageCropEditor = dynamic(() =>
  import("@/components/shared/ImageCropEditor").then(
    (module) => module.ImageCropEditor,
  ),
);

export function EditorImagePicker({
  label,
  images,
  onChange,
  multiple = false,
  hint,
  copy,
  variant = "default",
  labels,
  requestCrop,
  validation = { attempted: false },
  allowWebp = true,
  previewOnClick = false,
  onBusyChange,
}: {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  hint: string;
  copy: FormsCopy;
  variant?: "default" | "banner" | "logo" | "option" | "component";
  labels?: FormEditorCopy;
  requestCrop?: ((request: EditorImageCropRequest) => void) | null;
  validation?: { attempted: boolean; failedImage?: { image: string; message: string } | null };
  allowWebp?: boolean;
  previewOnClick?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [error, setError] = useState(false);
  const reorderGroup = useId();
  const imageEntries = useImageEntries(images);
  const canReorder = variant === "banner" && multiple && images.length > 1;
  const invalidImage =
    validation.attempted && images.some((image) => !isFormImage(image));
  const errorId = useId();
  const errorMessage =
    error || invalidImage
      ? copy.imageError
      : validation.failedImage && images.includes(validation.failedImage.image)
        ? validation.failedImage.message
        : undefined;
  const [busy, setBusy] = useState(false);
  useEditorMediaActivity(busy);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const replacement = useRef<number | null>(null);
  const [openedImage, setOpenedImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    index: number;
    src: string;
  } | null>(null);
  const imagesRef = useRef(images);
  const onChangeRef = useRef(onChange);
  const reorder = (source: string, target: string) => {
    if (!canReorder || busy) return;
    const next = reorderItems(imageEntries, source, target);
    if (next !== imageEntries) onChange(next.map((entry) => entry.image));
  };
  useEffect(() => {
    onChangeRef.current = onChange;
    imagesRef.current = images;
  }, [onChange, images]);
  const choose = (index: number | null = null) => {
    replacement.current = index;
    fileInput.current?.click();
  };
  const confirmCrop = async (
    target: { index: number; src: string },
    file: File,
  ) => {
    const request = generation.current;
    const cropped = await readFormImage(file);
    const current = imagesRef.current;
    if (request !== generation.current || current[target.index] !== target.src)
      throw new Error("Image changed during crop");
    onChangeRef.current(
      current.map((image, index) => (index === target.index ? cropped : image)),
    );
    setCropTarget(null);
    setError(false);
    if (!requestCrop) toast.success(copy.notifications.cropApplied);
  };
  const openCrop = (index: number, src: string, returnFocus?: HTMLElement) => {
    const target = { index, src };
    if (requestCrop)
      requestCrop({
        src,
        aspect: "free",
        maxEdge: variant === "logo" ? 720 : 1440,
        allowWebp,
        onConfirm: (file) => confirmCrop(target, file),
        returnFocus,
      });
    else setCropTarget(target);
  };
  const thumbnails = variant !== "default" && labels;
  const sideActions = !!thumbnails && !multiple && variant !== "option";
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  return (
    <div className="space-y-2">
      <EditorField
        label={label}
        error={errorMessage}
        errorId={errorId}
        className={thumbnails ? "[&>span:first-child]:sr-only" : undefined}
      >
        <input
          ref={fileInput}
          type="file"
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          accept={allowWebp ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg"}
          multiple={multiple}
          disabled={busy || (!thumbnails && multiple && images.length >= 5)}
          aria-label={label}
          className={
            thumbnails
              ? "sr-only"
              : `${SHARED_CONTROL_CLASS} block w-full p-2 text-[13px] file:me-2 file:rounded-lg file:border-0 file:bg-transparent file:px-2 file:py-1.5 file:text-xs file:text-inherit`
          }
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (!files.length) return;
            const replaceIndex = replacement.current;
            replacement.current = null;
            if (
              (replaceIndex !== null && files.length !== 1) ||
              files.length +
              (multiple
                ? images.length - (replaceIndex !== null ? 1 : 0)
                : 0) >
              (multiple ? 5 : 1)
            ) {
              setError(true);
              toast.error(copy.imageError);
              return;
            }
            const request = ++generation.current;
            setBusy(true);
            setError(false);
            try {
              if (!allowWebp && files.some((file) => !["image/png", "image/jpeg"].includes(file.type))) throw new Error("image");
              const added = await Promise.all(files.map(readFormImage));
              if (request === generation.current) {
                onChangeRef.current(
                  multiple
                    ? replaceIndex !== null
                      ? images.map((image, index) =>
                        index === replaceIndex ? added[0] : image,
                      )
                      : [...images, ...added]
                    : added,
                );
                toast.success(copy.notifications.imageSelected);
              }
            } catch {
              if (request === generation.current) { setError(true); toast.error(copy.imageError); }
            } finally {
              if (request === generation.current) setBusy(false);
            }
          }}
        />
      </EditorField>
      {thumbnails && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: multiple ? 5 : 1 }, (_, index) => {
              const image = images[index];
              const filled = image && isFormImage(image);
              const canAdd = !image && index === images.length;
              if (filled && variant === "banner" && multiple) return <EditorCarouselImageTile key={imageEntries[index].id}
                src={image} id={imageEntries[index].id} group={reorderGroup} disabled={busy} reorderEnabled={canReorder}
                label={`${copy.preview} ${label} ${index + 1}`} onChoose={() => setOpenedImage(image)}
                updateLabel={`${labels.updateImage} ${label} ${index + 1}`} onUpdate={() => choose(index)}
                cropLabel={`${copy.imageCrop.title}: ${label} ${index + 1}`}
                onCrop={() => openCrop(index, image)}
                removeLabel={`${copy.remove} ${label} ${index + 1}`} onRemove={() => onChange(images.filter((_, position) => position !== index))}
                onReorder={reorder} onStep={(offset) => { const target = imageEntries[index + offset]; if (target) reorder(imageEntries[index].id, target.id); }} />;
              return (
                <EditorImageTile
                  key={imageEntries[index]?.id ?? `empty-${index}`}
                  reorderId={filled && canReorder ? imageEntries[index].id : undefined}
                  reorderGroup={filled && canReorder ? reorderGroup : undefined}
                  src={filled ? image : null}
                  label={filled ? `${previewOnClick ? copy.preview : labels.updateImage} ${label} ${index + 1}` : `${label} ${index + 1}`}
                  onChoose={() => filled && previewOnClick ? setOpenedImage(image) : choose(filled ? index : null)}
                  disabled={busy || (multiple && !filled && !canAdd)}
                  sizeClass={variant === "component" ? (multiple ? "size-20" : "size-28") : variant === "logo" ? "size-24" : variant === "option" ? "size-14" : variant === "banner" && multiple ? "size-20" : "size-16"}
                  contain={variant === "component"}
                  placeholder={variant === "logo" || variant === "component" ? <ImageIcon className="size-7" /> : !multiple || canAdd ? <Plus className="size-5" /> : <span />}
                >
                  {filled && previewOnClick && <Tooltip content={labels.updateImage}><button type="button" disabled={busy}
                    aria-label={`${labels.updateImage} ${index + 1}`} onClick={() => choose(index)}
                    className="absolute start-1 top-1 flex size-5 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-slate-700"><Upload className="size-3" /></button></Tooltip>}
                  {filled && (
                    <Tooltip content={`${copy.remove} ${label} ${index + 1}`}><button
                      type="button"
                      disabled={busy}
                      aria-label={`${copy.remove} ${label} ${index + 1}`}
                      onClick={() =>
                        onChange(
                          images.filter((_, position) => position !== index),
                        )
                      }
                      className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-red-500"
                    >
                      <Trash2 className="size-3" />
                    </button></Tooltip>
                  )}
                  {filled && variant === "option" && (
                    <Tooltip content={`${copy.preview}: ${label}`}><button
                      type="button"
                      aria-label={`${copy.preview}: ${label}`}
                      onClick={() => setOpenedImage(image)}
                      className="absolute bottom-1 end-1 flex size-5 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-slate-700"
                    >
                      <Eye className="size-3" />
                    </button></Tooltip>
                  )}
                  {filled && !sideActions && (
                    <Tooltip content={`${copy.imageCrop.title}: ${label} ${index + 1}`}><button
                      type="button"
                      disabled={busy}
                      aria-label={`${copy.imageCrop.title}: ${label} ${index + 1}`}
                      title={copy.imageCrop.title}
                      onClick={(event) =>
                        openCrop(index, image, event.currentTarget)
                      }
                      className="absolute bottom-1 start-1 flex size-6 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <Crop className="size-3.5" />
                    </button></Tooltip>
                  )}
                </EditorImageTile>
              );
            })}
          </div>
          {sideActions && images.length > 0 && (
            <div className="space-y-1">
              <Tooltip content={`${copy.imageCrop.title}: ${label} 1`}><button
                type="button"
                disabled={busy || !isFormImage(images[0])}
                aria-label={`${copy.imageCrop.title}: ${label} 1`}
                onClick={(event) => openCrop(0, images[0], event.currentTarget)}
                className={EDITOR_IMAGE_ACTION_CLASS}
              >
                <Crop className="size-3.5" />
                {copy.imageCrop.title}
              </button></Tooltip>
              <button
                type="button"
                disabled={busy}
                onClick={() => choose(images.length ? 0 : null)}
                className={EDITOR_IMAGE_ACTION_CLASS}
              >
                <Upload className="size-3.5" />
                {labels.updateImage}
              </button>
            </div>
          )}
        </div>
      )}
      {hint && (
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {!thumbnails && !!images.length && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 dark:border-white/10"
            >
              {isFormImage(image) && (
                <Image
                  unoptimized
                  src={image}
                  width={48}
                  height={40}
                  alt=""
                  className="h-10 w-12 rounded object-cover"
                />
              )}
              <IconActionButton
                label={`${copy.imageCrop.title}: ${label} ${index + 1}`}
                disabled={busy || !isFormImage(image)}
                onClick={() => openCrop(index, image)}
              >
                <Crop className="size-3.5" />
              </IconActionButton>
              <IconActionButton
                tone="danger"
                label={`${copy.remove} ${label} ${index + 1}`}
                disabled={busy}
                onClick={() =>
                  onChange(images.filter((_, position) => position !== index))
                }
              >
                <Trash2 className="size-3.5" />
              </IconActionButton>
            </div>
          ))}
        </div>
      )}
      {openedImage && isFormImage(openedImage) && (
        <FullscreenImageViewer
          images={images.filter(isFormImage)}
          initialIndex={Math.max(0, images.filter(isFormImage).indexOf(openedImage))}
          title={label}
          labels={{ close: copy.close, previous: copy.back, next: copy.next, zoomIn: copy.zoomIn, zoomOut: copy.zoomOut }}
          onClose={() => setOpenedImage(null)}
        />
      )}
      {cropTarget && images[cropTarget.index] === cropTarget.src && (
        <Suspense
          fallback={
            <ImageCropEditorSkeleton
              copy={copy.imageCrop}
              cancelLabel={copy.cancel}
              onCancel={() => setCropTarget(null)}
            />
          }
        >
          <ImageCropEditor
            allowWebp={allowWebp}
            src={cropTarget.src}
            aspect="free"
            maxEdge={variant === "logo" ? 720 : 1440}
            copy={copy.imageCrop}
            cancelLabel={copy.cancel}
            onClose={() => setCropTarget(null)}
            onConfirm={(file) => confirmCrop(cropTarget, file)}
          />
        </Suspense>
      )}
    </div>
  );
}
