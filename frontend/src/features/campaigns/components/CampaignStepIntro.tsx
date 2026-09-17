import type { ReactNode } from "react";

export function CampaignStepIntro({
  title,
  description,
  aside,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4 dark:border-white/10">
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {aside}
    </div>
  );
}
