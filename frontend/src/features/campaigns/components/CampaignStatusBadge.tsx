import { CheckCircle2, Clock3, PauseCircle, Radio } from "lucide-react";

import type { CampaignStatus } from "../types";

const STATUS_STYLES: Record<
  CampaignStatus,
  {
    label: string;
    icon: typeof Radio;
    className: string;
  }
> = {
  active: {
    label: "چالاکە",
    icon: Radio,
    className:
      "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/25 dark:text-emerald-300",
  },
  paused: {
    label: "ڕاگیراوە",
    icon: PauseCircle,
    className:
      "border-slate-200/70 bg-slate-100/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
  },
  review: {
    label: "لە پێداچوونەوەدایە",
    icon: Clock3,
    className:
      "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-amber-300",
  },
  completed: {
    label: "تەواوبووە",
    icon: CheckCircle2,
    className:
      "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/25 dark:text-sky-300",
  },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
