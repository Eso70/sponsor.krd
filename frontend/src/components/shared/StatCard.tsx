"use client";

import { memo, type ComponentType, type ReactNode, type SVGProps } from "react";
import { StatCardCaption } from "./StatCardCaption";
import { StatCardFrame } from "./StatCardFrame";
import { SkeletonStatCard } from "./Skeleton";
import { Tooltip } from "./Tooltip";
import type { StatCardColor } from "./stat-card-styles";

export type { StatCardColor } from "./stat-card-styles";

export interface StatCardProps {
  action?: ReactNode;
  className?: string;
  color?: StatCardColor;
  compact?: boolean;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  subtitle?: string;
  value: number | string;
}

/** One presentation for metrics across pages, analytics, drawers and portals. */
export const StatCard = memo(function StatCard({
  action,
  className,
  color = "blue",
  compact = false,
  description,
  icon: Icon,
  label,
  loading = false,
  loadingLabel = "بارکردن",
  subtitle,
  value,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={loadingLabel}
        className="min-w-0 h-full"
      >
        <SkeletonStatCard
          className={className}
          color={color}
          compact={compact}
          showIcon={Boolean(Icon)}
          showDetail={Boolean(description || subtitle)}
          showAction={Boolean(action)}
        />
      </div>
    );
  }

  const text = typeof value === "number" ? Number.isFinite(value) ? value.toLocaleString() : "—" : value;
  return (
    <StatCardFrame
      action={action}
      className={className}
      color={color}
      compact={compact}
      icon={
        Icon ? (
          <Icon
            aria-hidden="true"
            className={compact ? "size-4" : "size-4 sm:size-5 md:size-6"}
          />
        ) : undefined
      }
      value={
        <Tooltip content={text}>
          <div
            tabIndex={typeof value === "string" ? 0 : undefined}
            className="min-w-0 truncate tabular-nums text-start"
          >
            <bdi dir="auto">{text}</bdi>
          </div>
        </Tooltip>
      }
      caption={
        <StatCardCaption label={label} detail={description || subtitle} />
      }
    />
  );
});
