import { Film, Play } from "lucide-react";

import type { TikTokCampaign } from "../types";

const TONE_CLASSES: Record<TikTokCampaign["video"]["tone"], string> = {
  cyan: "from-cyan-300 via-sky-400 to-indigo-500 dark:from-cyan-900 dark:via-sky-800 dark:to-indigo-900",
  violet:
    "from-violet-300 via-fuchsia-400 to-rose-400 dark:from-violet-900 dark:via-fuchsia-900 dark:to-rose-900",
  orange:
    "from-amber-200 via-orange-400 to-rose-400 dark:from-amber-900 dark:via-orange-900 dark:to-rose-900",
  rose: "from-rose-300 via-pink-400 to-violet-500 dark:from-rose-900 dark:via-pink-900 dark:to-violet-900",
};

interface CampaignVideoPreviewProps {
  campaign: TikTokCampaign;
  compact?: boolean;
}

export function CampaignVideoPreview({
  campaign,
  compact = false,
}: CampaignVideoPreviewProps) {
  return (
    <div
      className={`group/video relative shrink-0 overflow-hidden bg-linear-to-br shadow-inner ring-1 ring-inset ring-white/30 ${TONE_CLASSES[campaign.video.tone]} ${compact ? "h-14 w-20 rounded-xl" : "aspect-video w-full rounded-2xl"}`}
      aria-label={`ڤیدیۆی ${campaign.name}`}
    >
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-slate-950/20 blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.64),transparent_68%)]" />
      {!compact && (
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/20 px-2 py-1 font-mono text-[9px] font-semibold text-white shadow-sm backdrop-blur-md">
          {campaign.video.format} · {campaign.video.resolution}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/25 text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.7)] backdrop-blur-md transition-all duration-300 group-hover/video:scale-105 group-hover/video:bg-white/35">
          <Play className="h-4 w-4 fill-current" />
        </span>
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/75">
              <Film className="h-3 w-3" />
              TikTok creative
            </div>
            <p className="truncate text-xs font-semibold">
              {campaign.video.title}
            </p>
          </div>
          <span className="rounded-md bg-slate-950/55 px-1.5 py-0.5 font-mono text-[10px] backdrop-blur-sm">
            {campaign.video.duration}
          </span>
        </div>
      )}
      {compact && (
        <span className="absolute bottom-1 right-1 rounded bg-slate-950/60 px-1 py-0.5 font-mono text-[8px] text-white">
          {campaign.video.duration}
        </span>
      )}
    </div>
  );
}
