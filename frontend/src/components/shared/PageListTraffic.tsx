import { Eye, MousePointerClick } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";

export function PageListTraffic({
  views,
  interactions,
  labels,
  compact = false,
  centered = false,
}: {
  views: number;
  interactions: number;
  labels: { views: string; interactions: string };
  compact?: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-3"
          : "mb-2 grid grid-cols-2 gap-2 sm:mb-3"
      }
    >
      {[
        { Icon: Eye, value: views, label: labels.views },
        {
          Icon: MousePointerClick,
          value: interactions,
          label: labels.interactions,
        },
      ].map(({ Icon, value, label }) => (
        <Tooltip key={label} content={label} side="top">
          <span
            className={
              compact
                ? "inline-flex items-center gap-1 cursor-default"
                : `flex items-center ${centered ? "justify-center" : ""} ${SHARED_CONTROL_CLASS} min-w-0 gap-1.5 px-2 py-2 sm:py-2.5`
            }
          >
            <Icon
              className={`${compact ? "size-3" : "size-3.5"} shrink-0 text-gray-400`}
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {value.toLocaleString()}
            </span>
            {!compact && (
              <span className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                {label}
              </span>
            )}
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
