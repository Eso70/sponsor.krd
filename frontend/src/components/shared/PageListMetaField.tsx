"use client";

import { memo } from "react";
import { Tooltip } from "./Tooltip";

interface PageListMetaFieldProps {
  label: string;
  value: string;
  className?: string;
}

/** Labelled read-only field shared by page collections. */
export const PageListMetaField = memo(function PageListMetaField({
  label,
  value,
  className = "",
}: PageListMetaFieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-medium text-gray-400">
        {label}
      </span>
      <Tooltip content={value} side="top">
        <span className="block truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
          {value}
        </span>
      </Tooltip>
    </div>
  );
});
