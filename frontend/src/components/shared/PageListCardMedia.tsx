import type { ReactNode } from "react";

export function PageListCardMedia({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {action && (
        <div className="absolute right-3 top-3 z-10 empty:hidden">{action}</div>
      )}
    </div>
  );
}
