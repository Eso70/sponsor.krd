"use client";
import styles from "./PublicImageGallery.module.css";
import { Tooltip } from "@/components/shared/Tooltip";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { isLocalRasterImage as isFormImage } from "@/lib/images/local-raster-image";
import type { ImageMediaCopy } from "./image-media-copy";
import { usePublicImageDimensions } from "./PublicImageDimensionsProvider";
import { FullscreenImageViewer } from "./LazyFullscreenImageViewer";
import {
  STANDARD_TEMPLATE_HEADER_AVATAR_SIZES,
  STANDARD_TEMPLATE_HEADER_CLASSES,
} from "@/components/templates/shared/template-header-styles";

export function PublicImageGallery({
  images,
  carousel = false,
  autoPlay = true,
  placeholder = false,
  logo = false,
  largeLogo = false,
  option = false,
  avatar = false,
  imageTitle,
  banner = false,
  eager = false,
  cover = false,
  compact = false,
  edgeToEdge = false,
  copy,
  onImageOpen,
  onSlideChange,
}: {
  images: string[];
  carousel?: boolean;
  autoPlay?: boolean;
  placeholder?: boolean;
  logo?: boolean;
  largeLogo?: boolean;
  option?: boolean;
  avatar?: boolean;
  imageTitle?: string;
  banner?: boolean;
  eager?: boolean;
  cover?: boolean;
  compact?: boolean;
  /** Fill a fitted template's width while preserving the banner's vertical box. */
  edgeToEdge?: boolean;
  copy: ImageMediaCopy;
  onImageOpen?: (index: number) => void;
  onSlideChange?: (index: number) => void;
}) {
  const dimensions = usePublicImageDimensions();
  const [position, setPosition] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [loadedDimensions, setLoadedDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [mouseDragging, setMouseDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const mouseStart = useRef<{ x: number; y: number; id: number } | null>(null);
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
  const safeImages = (banner && !carousel ? images.slice(0, 1) : images).filter(
    (source) => isFormImage(source) && !failedImages.includes(source),
  );
  const current = carousel
    ? ((position % (safeImages.length || 1)) + safeImages.length) %
      (safeImages.length || 1)
    : 0;
  const canMove = carousel && safeImages.length > 1;
  const firstDimensions = dimensions[safeImages[0]] ?? loadedDimensions[safeImages[0]];
  const reserveBanner = banner && !cover && !!firstDimensions;
  const fullWidthBanner = edgeToEdge && reserveBanner;
  const move = (offset: number) => {
    if (!canMove || position < 0 || position >= safeImages.length) return;
    const next = (current + offset + safeImages.length) % safeImages.length;
    setPosition(current + offset);
    onSlideChange?.(next);
  };
  // Edge clones continue the same movement in either direction. Once the
  // transition finishes, jump invisibly to the matching real slide.
  useEffect(() => {
    if (!canMove || (position >= 0 && position < safeImages.length)) return;
    const timer = setTimeout(() => {
      setSnapping(true);
      setPosition(current);
    }, 400);
    return () => clearTimeout(timer);
  }, [canMove, position, current, safeImages.length]);
  useEffect(() => {
    if (!snapping) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSnapping(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [snapping]);
  useEffect(() => {
    if (
      !banner ||
      !autoPlay ||
      !canMove ||
      openedIndex !== null ||
      hovered ||
      focused ||
      touching ||
      mouseDragging
    )
      return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      timer = setTimeout(() => setPosition(current + 1), 3000);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [
    banner,
    autoPlay,
    canMove,
    current,
    safeImages.length,
    openedIndex,
    hovered,
    focused,
    touching,
    mouseDragging,
  ]);
  if (!safeImages.length && !placeholder) return null;
  const renderImage = (source: string, active = true) => (
    <Image
      unoptimized={source.startsWith("data:")}
      sizes={
        option
          ? "56px"
          : logo
            ? "112px"
            : banner
              ? "100vw"
              : "(min-width: 960px) 896px, 100vw"
      }
      loading={eager && active ? "eager" : "lazy"}
      fetchPriority={eager && active ? "high" : "auto"}
      src={source}
      width={option ? 56 : logo ? logoSize : (dimensions[source]?.width ?? 400)}
      height={
        option
          ? 56
          : logo
            ? logoSize
            : (dimensions[source]?.height ?? (banner ? 144 : 112))
      }
      onError={() =>
        setFailedImages((failed) =>
          failed.includes(source) ? failed : [...failed, source],
        )
      }
      onLoad={(event) => {
        if (!edgeToEdge || !banner || cover || source !== safeImages[0] || dimensions[source]) return;
        const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
        if (width > 0 && height > 0) setLoadedDimensions(previous => previous[source] ? previous : { ...previous, [source]: { width, height } });
      }}
      draggable={false}
      alt=""
      className={
        option
          ? "size-14 object-cover"
          : logo
            ? `${logoClass} object-cover`
            : cover || fullWidthBanner
              ? "block h-full w-full object-cover"
              : banner
                ? `block ${reserveBanner ? "h-full" : "h-auto"} w-full object-contain`
                : "h-28 w-full object-cover"
      }
    />
  );
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
      className={`relative ${fullWidthBanner ? "overflow-visible" : "overflow-hidden"} ${cover ? (compact ? "h-12 w-20 shrink-0 rounded-lg" : "aspect-[3/1] w-full") : option ? "size-14 shrink-0 rounded-lg" : logo ? `${logoClass} rounded-full border border-slate-400/20` : "w-full"}`}
      style={{ ...(canMove ? { touchAction: "pan-y pinch-zoom" as const } : {}), ...(fullWidthBanner ? { aspectRatio: `${firstDimensions.width} / ${firstDimensions.height}` } : {}) }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
      onTouchStart={(event) => {
        swiped.current = false;
        if (!canMove || event.touches.length !== 1) {
          touchStart.current = null;
          return;
        }
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
        const dx = touch.clientX - start.x,
          dy = touch.clientY - start.y;
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          swiped.current = true;
          move(dx < 0 ? 1 : -1);
        }
      }}
      onTouchCancel={() => {
        touchStart.current = null;
        swiped.current = false;
        setTouching(false);
      }}
      onClickCapture={(event) => {
        if (!swiped.current) return;
        swiped.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {safeImages.length ? (
        <Tooltip content={`${copy.preview}: ${imageLabel}`}>
          <button
            data-image-preview-trigger
            type="button"
            aria-label={`${copy.preview}: ${imageLabel}`}
            onClick={() => {
              setOpenedIndex(current);
              onImageOpen?.(current);
            }}
            draggable={false}
            onPointerDown={(event) => {
              swiped.current = false;
              if (
                !canMove ||
                position < 0 ||
                position >= safeImages.length ||
                event.pointerType !== "mouse" ||
                event.button !== 0
              )
                return;
              mouseStart.current = {
                x: event.clientX,
                y: event.clientY,
                id: event.pointerId,
              };
              setMouseDragging(true);
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = mouseStart.current;
              if (!start || start.id !== event.pointerId) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                swiped.current = true;
                setDragOffset(dx);
                event.preventDefault();
              }
            }}
            onPointerUp={(event) => {
              const start = mouseStart.current;
              if (!start || start.id !== event.pointerId) return;
              mouseStart.current = null;
              setMouseDragging(false);
              setDragOffset(0);
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                swiped.current = true;
                move(dx < 0 ? 1 : -1);
              }
              if (event.currentTarget.hasPointerCapture?.(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onLostPointerCapture={() => {
              mouseStart.current = null;
              setMouseDragging(false);
              setDragOffset(0);
            }}
            onPointerCancel={() => {
              mouseStart.current = null;
              swiped.current = false;
              setMouseDragging(false);
              setDragOffset(0);
            }}
            style={
              reserveBanner
                ? {
                    aspectRatio: `${firstDimensions.width} / ${firstDimensions.height}`,
                    ...(fullWidthBanner ? {
                      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                      width: "calc(100% / var(--template-fit-scale, 1))", maxWidth: "none", height: "100%", overflow: "hidden",
                    } as const : {}),
                  }
                : undefined
            }
            className={`block w-full ${cover ? "h-full" : ""} ${canMove ? (mouseDragging ? "cursor-grabbing select-none" : "cursor-grab select-none") : "cursor-zoom-in"}`}
          >
            {canMove ? (
              <span
                className={`relative block overflow-hidden ${cover || reserveBanner ? "h-full" : ""}`}
                dir="ltr"
              >
                {[
                  safeImages[safeImages.length - 1],
                  ...safeImages,
                  safeImages[0],
                ].map((source, index) => (
                  <span
                    key={`${source}-${index}`}
                    data-current-slide={index === position + 1}
                    aria-hidden={index !== position + 1}
                    className={`${styles.slide} ${cover || reserveBanner ? styles.coverSlide : ""} ${mouseDragging || snapping ? styles.draggingSlide : ""}`}
                    style={{
                      position:
                        index === position + 1 ? "relative" : "absolute",
                      transform: dragOffset
                        ? `translateX(calc(${(index - position - 1) * 100}% + ${dragOffset}px))`
                        : `translateX(${(index - position - 1) * 100}%)`,
                    }}
                  >
                    {renderImage(source, index === position + 1)}
                  </span>
                ))}
              </span>
            ) : (
              renderImage(safeImages[current])
            )}
          </button>
        </Tooltip>
      ) : (
        <div
          className={`flex items-center justify-center bg-slate-400/10 ${cover ? "h-full" : logo ? logoClass : banner ? "h-36" : "h-28"}`}
        >
          <ImageIcon
            className={`${logo ? "size-5" : "size-10"} opacity-30`}
            aria-hidden
          />
        </div>
      )}
      {canMove && (
        <span
          className={`absolute inset-x-0 flex items-center justify-center ${cover && !compact ? "top-1" : "bottom-1"}`}
          dir="ltr"
        >
          {safeImages.map((source, index) => (
            <button
              key={`${source}-${index}`}
              data-media-control
              type="button"
              aria-label={`${imageLabel} ${index + 1} / ${safeImages.length}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                if (index !== current) move(index - current);
              }}
              className="flex size-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
            >
              <span
                aria-hidden
                className={`${styles.dot} ${index === current ? styles.activeDot : ""}`}
              />
            </button>
          ))}
        </span>
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
