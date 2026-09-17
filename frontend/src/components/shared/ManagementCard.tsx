import type { HTMLAttributes, ReactNode } from "react";

interface ManagementCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  intrinsicHeight?: number;
}

/** Shared card surface used by dashboard management grids. */
export function ManagementCard({
  children,
  intrinsicHeight = 330,
  className = "",
  style,
  ...props
}: ManagementCardProps) {
  return (
    <div
      {...props}
      className={`group relative flex h-full flex-col bg-white p-4 transition-all duration-300 transform-gpu hover:bg-slate-50/60 dark:bg-[#1c222b] dark:hover:bg-white/5 sm:p-5 md:p-6 ${className}`}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `${intrinsicHeight}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
