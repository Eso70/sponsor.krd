"use client";

import { X } from "lucide-react";
import { IconActionButton } from "./IconActionButton";

export function PickerPopupHeader({ title, titleId, subtitle, closeLabel, onClose }: {
  title: string;
  titleId?: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-3 pb-2">
      <div>
        <h2 id={titleId} className="text-[13px] font-semibold" style={{ color: "var(--picker-text, inherit)" }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--picker-muted, #94a3b8)" }}>{subtitle}</p>}
      </div>
      <IconActionButton label={closeLabel} onClick={onClose}>
        <X className="size-4" aria-hidden />
      </IconActionButton>
    </div>
  );
}
