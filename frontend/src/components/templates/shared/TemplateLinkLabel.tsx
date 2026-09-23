"use client";

import { memo, type CSSProperties } from "react";
import type { LinktreePresentationLink } from "@linktree/types";
import { getPlatformName } from "@/components/public/LinktreeButtons";
import { getLinkIdentity } from "./link-identity";

export interface TemplateLinkLabelProps {
  link: LinktreePresentationLink;
  className?: string;
  style?: CSSProperties;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  detailsClassName?: string;
  platformClassName?: string;
  platformStyle?: CSSProperties;
  identityClassName?: string;
  identityStyle?: CSSProperties;
}

/**
 * Shared Linktree button label. The owner-editable display name is primary;
 * the English platform name is catalog-owned; and an optional quieter identity
 * follows it in a separate element on the same secondary row.
 */
export const TemplateLinkLabel = memo(function TemplateLinkLabel({
  link,
  className = "min-w-0 flex-1 text-left",
  style,
  titleClassName = "block truncate text-base font-semibold leading-tight",
  titleStyle,
  detailsClassName = "mt-1 flex min-w-0 items-baseline gap-1 leading-tight",
  platformClassName = "min-w-0 truncate font-sans text-xs opacity-70",
  platformStyle,
  identityClassName = "min-w-0 truncate font-sans text-[11px] font-medium opacity-65",
  identityStyle,
}: TemplateLinkLabelProps) {
  const platformName = getPlatformName(link.platform);
  const title = link.display_name?.trim() || platformName;
  const identity = getLinkIdentity(link);

  return (
    <span className={className} style={style} data-template-link-label>
      <span className={titleClassName} style={titleStyle} data-link-title>
        {title}
      </span>
      <span className={detailsClassName} data-template-link-details dir="ltr">
        <span
          id={`link-text-${link.platform.toLowerCase()}`}
          className={platformClassName}
          style={platformStyle}
          data-template-platform-name
          data-platform={link.platform.toLowerCase()}
        >
          {platformName}
        </span>
        {identity ? (
          <>
            <span aria-hidden="true" className="shrink-0 opacity-40">
              -
            </span>
            <span
              className={identityClassName}
              style={identityStyle ?? platformStyle}
              data-template-link-identity
            >
              {identity}
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
});
