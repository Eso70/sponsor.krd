import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import {
  ACTION_ICON_TONES,
  type ActionIconTone,
} from "@/components/shared/action-icon-tones";

export function AnalyticsShareActionButton({
  label,
  icon: Icon,
  tone = "neutral",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  icon: LucideIcon;
  tone?: ActionIconTone;
}) {
  const iconColor = ACTION_ICON_TONES[tone];
  return (
    <Tooltip content={label}>
      <button
        {...props}
        type={props.type ?? "button"}
        aria-label={label}
        className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-xl text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 @[560px]:w-auto @[560px]:px-3`}
      >
        <Icon aria-hidden className={`size-4 shrink-0 ${iconColor}`} />
        <span className="hidden whitespace-nowrap @[560px]:inline">
          {label}
        </span>
      </button>
    </Tooltip>
  );
}
