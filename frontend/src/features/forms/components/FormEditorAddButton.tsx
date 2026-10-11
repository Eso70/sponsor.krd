import type { ReactNode } from "react";
import { Plus } from "lucide-react";
export function FormEditorAddButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="theme-soft inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold transition hover:opacity-80 disabled:opacity-40"
    >
      <Plus className="size-3.5" aria-hidden />
      {children}
    </button>
  );
}
