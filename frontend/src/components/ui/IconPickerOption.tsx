"use client";

import { memo } from "react";
import { Check } from "lucide-react";
import { CUSTOM_ICONS_MAP } from "@/lib/config/icons";
import surfaceStyles from "@/components/shared/picker-popup-surface.module.css";

export const IconPickerOption = memo(function IconPickerOption({
  iconName,
  isSelected,
  onClick,
}: {
  iconName: string;
  isSelected: boolean;
  onClick: (name: string) => void;
}) {
  const Icon = CUSTOM_ICONS_MAP[iconName];
  if (!Icon) return null;

  return (
    <button
      type="button"
      onClick={() => onClick(iconName)}
      aria-label={iconName}
      aria-pressed={isSelected}
      title={iconName}
      className={`relative flex h-16 sm:h-[76px] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-1.5 py-2 text-slate-600 transition-colors duration-150 dark:text-slate-300 motion-reduce:transition-none ${
        isSelected
          ? surfaceStyles.selected
          : "border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-white/5"
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "76px", color: "var(--picker-text, inherit)" }}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {isSelected && <Check className="absolute right-1.5 top-1.5 size-3 text-slate-500 dark:text-slate-300" aria-hidden />}
      <span className="line-clamp-2 w-full break-words text-center text-[10px] leading-3" style={{ color: "var(--picker-muted, #94a3b8)" }}>
        {iconName.replace(/^(Fa|Si|Bs|Tb|Md|AiOutline|Ai)/, "").replace(/([a-z])([A-Z])/g, "$1 $2")}
      </span>
    </button>
  );
});
