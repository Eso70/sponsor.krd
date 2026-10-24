import type { HTMLAttributes, ReactNode } from "react";
import styles from "./management-collection.module.css";

interface ManagementCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  intrinsicHeight?: number;
  media?: ReactNode;
}

/** Shared card surface used by dashboard management grids. */
export function ManagementCard({
  children,
  intrinsicHeight = 330,
  media,
  className = "",
  style,
  ...props
}: ManagementCardProps) {
  return (
    <div
      {...props}
      className={`${styles.card} group relative flex h-full flex-col bg-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-50/60 dark:bg-[#1c222b] dark:hover:bg-white/5 ${media ? "overflow-hidden" : "p-4 sm:p-5 md:p-6"} ${className}`}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `${intrinsicHeight}px`,
        ...style,
      }}
    >
      {media}
      {media ? (
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 md:p-6">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
