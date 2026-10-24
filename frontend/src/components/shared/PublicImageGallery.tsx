"use client";
import { Tooltip } from "@/components/shared/Tooltip";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { isLocalRasterImage as isFormImage } from "@/lib/images/local-raster-image";
import type { ImageMediaCopy } from "./image-media-copy";
import { FullscreenImageViewer } from "@/components/shared/FullscreenImageViewer";
import {
  STANDARD_TEMPLATE_HEADER_AVATAR_SIZES,
  STANDARD_TEMPLATE_HEADER_CLASSES,
} from "@/components/templates/shared/TemplateHeader";

export function PublicImageGallery({
  images,
  carousel = false,
  placeholder = false,
  logo = false,
  largeLogo = false,
  option = false,
  avatar = false,
  imageTitle,
  banner = false,
  eager = false,
  copy,
  onImageOpen,
  onSlideChange,
}: {
  images: string[];
  carousel?: boolean;
  placeholder?: boolean;
  logo?: boolean;
  largeLogo?: boolean;
  option?: boolean;
  avatar?: boolean;
  imageTitle?: string;
  banner?: boolean;
  eager?: boolean;
  copy: ImageMediaCopy;
  onImageOpen?: (index: number) => void;
  onSlideChange?: (index: number) => void;
}) {
  const [position, setPosition] = useState(0);
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const logoSize = avatar
    ? 80
    : largeLogo
      ? Number.parseInt(STANDARD_TEMPLATE_HEADER_AVATAR_SIZES, 10)
      : 40;
  const logoClass = avatar
    ? "size-20"
    : largeLogo
      ? STANDARD_TEMPLATE_HEADER_CLASSES.avatar
      : "size-10";
  const imageLabel =
    imageTitle ?? (logo ? copy.logo : option ? copy.options : copy.banner);
  logo = logo || avatar;
  const safeImages = (banner && !carousel ? images.slice(0, 1) : images).filter(isFormImage);
  const current = carousel
    ? Math.min(position, Math.max(0, safeImages.length - 1))
    : 0;
  const canMove = carousel && safeImages.length > 1;
  const move = (offset: number) => {
    if (!canMove) return;
    const next = (current + offset + safeImages.length) % safeImages.length;
    setPosition(next);
    onSlideChange?.(next);
  };
  useEffect(() => {
    if (!banner || !canMove || openedIndex !== null || hovered || focused || touching) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      timer = setTimeout(() => setPosition((current + 1) % safeImages.length), 3000);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [banner, canMove, current, safeImages.length, openedIndex, hovered, focused, touching]);
  if (!safeImages.length && !placeholder) return null;
  const image = safeImages.length ? (
    <Image
      unoptimized={safeImages[current].startsWith("data:")}
      sizes={
        option
          ? "56px"
          : logo
            ? "112px"
            : banner
              ? "100vw"
              : "(min-width: 960px) 896px, 100vw"
      }
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      src={safeImages[current]}
      width={option ? 56 : logo ? logoSize : 400}
      height={option ? 56 : logo ? logoSize : banner ? 144 : 112}
      alt=""
      className={
        option
          ? "size-14 object-cover"
          : logo
            ? `${logoClass} object-cover`
            : banner
              ? "block h-auto w-full object-contain"
              : "h-28 w-full object-cover"
      }
    />
  ) : null;
  return (
    <div
      data-form-media={
        avatar
          ? "avatar"
          : logo
            ? "logo"
            : banner
              ? "banner"
              : option
                ? "option"
                : "image"
      }
      className={`relative overflow-hidden ${option ? "size-14 shrink-0 rounded-lg" : logo ? `${logoClass} rounded-full border border-slate-400/20` : "w-full"}`}
      style={canMove ? { touchAction: "pan-y pinch-zoom" } : undefined}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      onTouchStart={(event) => {
        swiped.current = false;
        if (!canMove || event.touches.length !== 1) { touchStart.current = null; return; }
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        setTouching(true);
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        setTouching(false);
        const touch = event.changedTouches[0];
        if (!start || !touch) return;
        const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          swiped.current = true;
          move(dx < 0 ? 1 : -1);
        }
      }}
      onTouchCancel={() => { touchStart.current = null; swiped.current = false; setTouching(false); }}
      onClickCapture={(event) => {
        if (!swiped.current) return;
        swiped.current = false;
        event.preventDefault(); event.stopPropagation();
      }}
    >
      {safeImages.length ? (
        <Tooltip content={`${copy.preview}: ${imageLabel}`}><button
          data-image-preview-trigger
          type="button"
          aria-label={`${copy.preview}: ${imageLabel}`}
          onClick={() => { setOpenedIndex(current); onImageOpen?.(current); }}
          className="block w-full cursor-zoom-in"
        >
          {image}
        </button></Tooltip>
      ) : (
        <div
          className={`flex items-center justify-center bg-slate-400/10 ${logo ? logoClass : banner ? "h-36" : "h-28"}`}
        >
          <ImageIcon
            className={`${logo ? "size-5" : "size-10"} opacity-30`}
            aria-hidden
          />
        </div>
      )}
      {carousel && safeImages.length > 1 && (
        <div
          className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between text-white"
          dir="ltr"
        >
          <Tooltip content={copy.back}><button
            data-media-control
            type="button"
            aria-label={copy.back}
            onClick={() => move(-1)}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/40 transition hover:bg-black/60"
          >
            <ChevronLeft className="size-4" />
          </button></Tooltip>
          <Tooltip content={copy.next}><button
            data-media-control
            type="button"
            aria-label={copy.next}
            onClick={() => move(1)}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/40 transition hover:bg-black/60"
          >
            <ChevronRight className="size-4" />
          </button></Tooltip>
        </div>
      )}
      {openedIndex !== null && safeImages.length > 0 && (
        <FullscreenImageViewer
          images={safeImages}
          initialIndex={openedIndex}
          title={imageLabel}
          labels={{
            close: copy.close,
            previous: copy.back,
            next: copy.next,
            zoomIn: copy.zoomIn,
            zoomOut: copy.zoomOut,
          }}
          onClose={() => setOpenedIndex(null)}
        />
      )}
    </div>
  );
}
