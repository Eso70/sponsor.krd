"use client";

import type { ButtonHTMLAttributes } from "react";
import { HEADER_ACTION_BUTTON_CLASS } from "./shared-control-styles";

export const dashboardHeaderActionClassName = HEADER_ACTION_BUTTON_CLASS;

export function DashboardHeaderActionButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${dashboardHeaderActionClassName} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
