import styles from "./dashboard-sidebar.module.css";

export function sidebarPlanButtonClassName(collapsed: boolean): string {
  return `${styles.plan} flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[15px] px-3 py-2.5 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${collapsed ? "md:min-h-11 md:justify-center md:gap-0 md:px-0 md:py-2.5" : ""}`;
}
