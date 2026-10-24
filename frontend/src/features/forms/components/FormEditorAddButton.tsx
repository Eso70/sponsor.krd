import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
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
      className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex min-h-10 items-center gap-2 px-3 py-2 text-[13px] font-semibold disabled:opacity-40`}
    >
      <Plus className="size-3.5" aria-hidden />
      {children}
    </button>
  );
}
