import { Save, type LucideIcon } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import styles from "./page-management.module.css";

export function SettingsActionButton({
  label,
  onClick,
  icon: Icon = Save,
  disabled = false,
  type = "button",
  variant = "primary",
  accentMode = "platform",
  iconOnly = false,
  busy = false,
  tooltip,
}: {
  label: string;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "soft";
  accentMode?: "tenant" | "platform";
  iconOnly?: boolean;
  busy?: boolean;
  tooltip?: string;
}) {
  return (
    <Tooltip content={tooltip ?? label} side="top">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || busy}
        aria-label={label}
        aria-busy={busy || undefined}
        className={`${styles.create} ${iconOnly ? styles.iconAction : ""} ${variant === "soft" ? SHARED_SOFT_BUTTON_CLASS : accentMode === "platform" ? "sa-gradient sa-ink" : "theme-fill text-[var(--theme-ink)]"} border-0 transition-colors motion-reduce:transition-none`}
      >
        <MotionSpinner active={busy}>
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        </MotionSpinner>
        {!iconOnly && <span className="min-w-0 truncate">{label}</span>}
      </button>
    </Tooltip>
  );
}
