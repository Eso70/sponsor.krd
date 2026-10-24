"use client";

import { NavigationSelectionHighlight } from "./NavigationSelection";
import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import styles from "./dashboard-sidebar.module.css";

/** The same compact navigation row for sidebar pages, links and secondary actions. */
export function DashboardSidebarAction({
  collapsed,
  label,
  icon,
  href,
  onClick,
  active = false,
  disabled = false,
  disabledReason,
}: {
  collapsed: boolean;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const className = styles.action;
  const content = (
    <>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={`min-w-0 truncate ${collapsed ? "md:hidden" : ""}`}>
        {label}
      </span>
    </>
  );
  return (
    <Tooltip
      content={disabledReason || label}
      side="right"
      disabled={!collapsed && !disabledReason}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-collapsed={collapsed || undefined}
          aria-label={label}
          className={className}
          onClick={onClick}
        >
          {content}
        </a>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-disabled={disabled || undefined}
          aria-current={active ? "page" : undefined}
          onClick={onClick}
          data-collapsed={collapsed || undefined}
          aria-label={label}
          className={className}
        >
          {active && <NavigationSelectionHighlight />}
          {content}
        </button>
      )}
    </Tooltip>
  );
}
