"use client";
import { useFormValidation } from "./FormValidationContext";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, ImageIcon, Plus, Upload, Eye, Crop } from "lucide-react";
import dynamic from "next/dynamic";
import { ImageCropEditorSkeleton } from "@/components/shared/ImageCropEditorSkeleton";
import { ImagePreviewModal } from "@/components/shared/ImagePreviewModal";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { EditorField } from "@/components/shared/EditorField";
import { isFormImage, readFormImage } from "../form-media";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { useFormImageCrop } from "./FormImageCropContext";

const ImageCropEditor = dynamic(() =>
  import("@/components/shared/ImageCropEditor").then(
    (module) => module.ImageCropEditor,
  ),
);

export function FormImagePicker({
  label,
  images,
  onChange,
  multiple = false,
  hint,
  copy,
  variant = "default",
  labels,
}: {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  hint: string;
  copy: FormsCopy;
  variant?: "default" | "banner" | "logo" | "option" | "component";
  labels?: FormEditorCopy;
}) {
  const validation = useFormValidation();
  const requestCrop = useFormImageCrop();
  const [error, setError] = useState(false);
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
  };
  const openCrop = (index: number, src: string, returnFocus?: HTMLElement) => {
    const target = { index, src };
    if (requestCrop)
      requestCrop({
        src,
        aspect: "free",
        maxEdge: variant === "logo" ? 720 : 1440,
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
          accept="image/png,image/jpeg,image/webp"
          multiple={multiple}
          disabled={busy || (!thumbnails && multiple && images.length >= 5)}
          aria-label={label}
          className={
            thumbnails
              ? "sr-only"
              : "block w-full rounded-lg border border-dashed border-slate-300 p-2 text-[13px] text-slate-500 file:me-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-xs dark:border-white/20 dark:text-slate-400 dark:file:bg-white/10 dark:file:text-slate-200"
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
              return;
            }
            const request = ++generation.current;
            setBusy(true);
            setError(false);
            try {
              const added = await Promise.all(files.map(readFormImage));
              if (request === generation.current)
                onChangeRef.current(
                  multiple
                    ? replaceIndex !== null
                      ? images.map((image, index) =>
                          index === replaceIndex ? added[0] : image,
                        )
                      : [...images, ...added]
                    : added,
                );
            } catch {
              if (request === generation.current) setError(true);
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
              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-xl border ${filled ? "border-slate-200 dark:border-white/10" : "border-dashed border-slate-300 dark:border-white/15"} ${variant === "component" ? (multiple ? "size-20" : "size-28") : variant === "logo" ? "size-24" : variant === "option" ? "size-14" : "size-16"} bg-slate-50 dark:bg-white/[0.03]`}
                >
                  <button
                    type="button"
                    disabled={busy || (multiple && !filled && !canAdd)}
                    onClick={() => choose(filled ? index : null)}
                    aria-label={
                      filled
                        ? `${labels.updateImage} ${label} ${index + 1}`
                        : `${label} ${index + 1}`
                    }
                    className="relative flex h-full w-full items-center justify-center text-slate-400 transition hover:bg-slate-100 disabled:cursor-default dark:hover:bg-white/5"
                  >
                    {filled ? (
                      <Image
                        unoptimized
                        src={image}
                        alt=""
                        fill
                        className={
                          variant === "component"
                            ? "object-contain p-2"
                            : "object-cover"
                        }
                      />
                    ) : variant === "logo" || variant === "component" ? (
                      <ImageIcon className="size-7" />
                    ) : !multiple || canAdd ? (
                      <Plus className="size-5" />
                    ) : null}
                  </button>
                  {filled && (
                    <button
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
                    </button>
                  )}
                  {filled && variant === "option" && (
                    <button
                      type="button"
                      aria-label={`${copy.preview}: ${label}`}
                      onClick={() => setOpenedImage(image)}
                      className="absolute bottom-1 end-1 flex size-5 items-center justify-center rounded-md bg-slate-950/70 text-white hover:bg-slate-700"
                    >
                      <Eye className="size-3" />
                    </button>
                  )}
                  {filled && !sideActions && (
                    <button
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
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {sideActions && images.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                disabled={busy || !isFormImage(images[0])}
                aria-label={`${copy.imageCrop.title}: ${label} 1`}
                onClick={(event) => openCrop(0, images[0], event.currentTarget)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Crop className="size-3.5" />
                {copy.imageCrop.title}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => choose(images.length ? 0 : null)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5"
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
        <ImagePreviewModal
          src={openedImage}
          title={label}
          closeLabel={copy.close}
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
