"use client";

import Image from "next/image";
import { ManagementModal } from "./ManagementModal";

/** Full, uncropped view of an image already validated by the owning upload flow. */
export function ImagePreviewModal({
  src,
  title,
  closeLabel,
  onClose,
}: {
  src: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={title}
      closeLabel={closeLabel}
      extraWide
      compactHeader
    >
      <div className="relative h-[65dvh] w-full overflow-hidden rounded-xl bg-slate-950/5 dark:bg-black/20">
        <Image
          unoptimized
          src={src}
          alt={title}
          fill
          sizes="90vw"
          className="object-contain"
        />
      </div>
    </ManagementModal>
  );
}
