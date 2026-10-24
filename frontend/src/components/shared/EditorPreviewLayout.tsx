import type { ReactNode } from "react";

/** Shared responsive editor/preview panes used inside the management drawer. */
export function EditorPreviewLayout({ children, preview, previewLabel, direction = "ltr" }: {
  children: ReactNode;
  preview: ReactNode;
  previewLabel: string;
  direction?: "ltr" | "rtl";
}) {
  return (
    <div dir="ltr" className="grid min-h-0 min-w-0 gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(290px,370px)]">
      <div dir={direction} className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:overscroll-contain lg:pe-1">{children}</div>
      <aside className="flex h-[min(70dvh,640px)] min-h-0 min-w-0 flex-col border-t border-slate-200 pt-4 dark:border-white/10 lg:h-full lg:border-t-0 lg:border-s lg:ps-4 lg:pt-0" aria-label={previewLabel} dir="ltr">{preview}</aside>
    </div>
  );
}
