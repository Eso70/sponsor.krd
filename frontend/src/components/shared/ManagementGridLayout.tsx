import type { ReactNode } from "react";
import styles from "./management-collection.module.css";

/** Server-safe grid surface shared by interactive collections and loading UI. */
export function ManagementGridLayout({
  items,
  desktopColumns = 3,
  className = "",
  footer,
  centered = false,
  cardSize = "default",
}: {
  items: readonly { key: string; content: ReactNode }[];
  desktopColumns?: 2 | 3;
  className?: string;
  footer?: ReactNode;
  /** Public collections keep sparse rows centered without stretching a single card. */
  centered?: boolean;
  cardSize?: "default" | "large";
}) {
  const cellBorders = (index: number) => {
    const total = items.length;
    const lastTwoRowStart = total - (total % 2 || 2);
    const lastThreeRowStart = total - (total % 3 || 3);
    const mobile = index < total - 1 ? "border-b" : "border-b-0";
    const twoColumns = `${index % 2 === 0 ? "lg:border-r" : "lg:border-r-0"} ${index < lastTwoRowStart ? "lg:border-b" : "lg:border-b-0"}`;
    const threeColumns =
      desktopColumns === 3
        ? `${index % 3 === 2 ? "xl:border-r-0" : "xl:border-r"} ${index < lastThreeRowStart ? "xl:border-b" : "xl:border-b-0"}`
        : "";
    return `${mobile} ${twoColumns} ${threeColumns}`;
  };
  return (
    <div className={className} dir="ltr">
      <div
        className={centered ? "flex flex-wrap justify-center gap-5" : `${styles.frame} grid grid-cols-1 lg:grid-cols-2 ${desktopColumns === 3 ? "xl:grid-cols-3" : ""}`}
      >
        {items.map((item, index) => (
          <div
            key={item.key}
            className={centered ? `${styles.frame} min-w-0 max-w-full ${cardSize === "large" ? "[flex:0_1_24rem]" : "[flex:0_1_21rem]"}` : `min-w-0 border-slate-100 dark:border-white/5 ${cellBorders(index)}`}
          >
            {item.content}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
