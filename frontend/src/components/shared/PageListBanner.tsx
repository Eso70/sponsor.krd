"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
/** Static cover from the saved banner order; collection thumbnails never autoplay. */
export function PageListBanner({
  src,
  compact = false,
}: {
  src?: string | null;
  compact?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-slate-100 dark:bg-white/[0.04] ${compact ? "h-12 w-20 rounded-lg" : "aspect-[3/1] w-full"}`}
    >
      {src && failedSrc !== src ? (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          loading="lazy"
          unoptimized
          sizes={
            compact
              ? "80px"
              : "(min-width: 1280px) 33vw, (min-width: 1024px) 50vw, 100vw"
          }
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-[linear-gradient(120deg,color-mix(in_srgb,var(--theme-primary,#64748b)_8%,transparent),transparent)]">
          <ImageIcon
            className={`${compact ? "size-4" : "size-7"} text-slate-300 dark:text-slate-600`}
          />
        </div>
      )}
    </div>
  );
}
