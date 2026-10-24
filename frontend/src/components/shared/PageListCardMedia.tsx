import type { ReactNode } from "react";

/** Live cards and skeletons share one centered row over the banner. */
export function PageListCardMedia({
  children,
  selection,
  action,
}: {
  children: ReactNode;
  selection?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {(selection || action) && (
        <div data-page-card-controls dir="ltr" className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
          <div className="pointer-events-auto flex size-8 shrink-0 items-center justify-center">{selection}</div>
          <div className="pointer-events-auto flex size-8 shrink-0 items-center justify-center">{action}</div>
        </div>
      )}
    </div>
  );
}
