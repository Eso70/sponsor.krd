"use client";
import { GripVertical } from "lucide-react";
import { useReorderGesture } from "@/hooks/useReorderGesture";

/** Visible grip for row editors; thumbnails use the same gesture on the image. */
export function ReorderHandle(props: {
  id: string; group: string; label: string;
  onReorder: (source: string, target: string) => void;
  onStep: (offset: number) => void; disabled?: boolean;
}) {
  const gesture = useReorderGesture(props);
  return <button type="button" disabled={props.disabled} aria-label={props.label} title={props.label}
    className="flex size-8 shrink-0 touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 active:cursor-grabbing dark:hover:bg-white/10 cursor-grab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)]"
    {...gesture}><GripVertical aria-hidden className="size-4" /></button>;
}
