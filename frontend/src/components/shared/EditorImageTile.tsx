"use client";
import Image from "next/image";
import type { ReactNode } from "react";
import { ImageIcon } from "lucide-react";

/** Shared thumbnail surface; owners retain their upload, crop and validation behavior. */
export function EditorImageTile({ src, label, onChoose, disabled = false, sizeClass = "size-24", contain = false, placeholder, children, reorderId, reorderGroup }: {
  src?: string | null;
  label: string;
  onChoose: () => void;
  disabled?: boolean;
  sizeClass?: string;
  contain?: boolean;
  placeholder?: ReactNode;
  children?: ReactNode;
  reorderId?: string;
  reorderGroup?: string;
}) {
  return <div data-reorder-id={reorderId} data-reorder-group={reorderGroup} className={`relative overflow-hidden rounded-2xl border ${src ? "border-slate-200/60 dark:border-white/[0.06]" : "border-dashed border-slate-200 dark:border-white/10"} ${sizeClass} bg-[var(--shared-control-surface)]`}>
    <button type="button" disabled={disabled} onClick={onChoose} aria-label={label}
      className="relative flex h-full w-full items-center justify-center text-slate-400 transition hover:bg-slate-100 disabled:cursor-default dark:hover:bg-white/5">
      {src ? <Image unoptimized src={src} alt="" fill className={contain ? "object-contain p-2" : "object-cover"} /> : placeholder ?? <ImageIcon className="size-7" />}
    </button>
    {children}
  </div>;
}
