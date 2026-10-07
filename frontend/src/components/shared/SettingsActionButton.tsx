import { Save, type LucideIcon } from "lucide-react";

export function SettingsActionButton({
  label,
  onClick,
  icon: Icon = Save,
  disabled = false,
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="sa-gradient sa-gradient-hover flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
