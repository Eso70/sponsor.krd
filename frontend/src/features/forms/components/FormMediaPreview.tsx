"use client";
import { useState } from "react";
import Image from "next/image";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { isFormImage } from "../form-media";
import type { FormsCopy } from "../forms-copy";
import { FullscreenImageViewer } from "@/components/shared/FullscreenImageViewer";
import {
  STANDARD_TEMPLATE_HEADER_AVATAR_SIZES,
  STANDARD_TEMPLATE_HEADER_CLASSES,
} from "@/components/templates/shared/TemplateHeader";

export function FormMediaPreview({
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
  copy: FormsCopy;
}) {
  const [position, setPosition] = useState(0);
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
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
  const safeImages = images.filter(isFormImage);
  const current = carousel
    ? Math.min(position, Math.max(0, safeImages.length - 1))
    : 0;
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
    >
      {safeImages.length ? (
        <button
          type="button"
          aria-label={`${copy.preview}: ${imageLabel}`}
          onClick={() => setOpenedIndex(current)}
          className="block w-full cursor-zoom-in"
        >
          {image}
        </button>
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
          <button
            type="button"
            aria-label={copy.back}
            onClick={() =>
              setPosition((current + safeImages.length - 1) % safeImages.length)
            }
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/40 transition hover:bg-black/60"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={copy.next}
            onClick={() => setPosition((current + 1) % safeImages.length)}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/40 transition hover:bg-black/60"
          >
            <ChevronRight className="size-4" />
          </button>
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
