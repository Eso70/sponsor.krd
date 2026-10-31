import { Globe2, ListChecks } from "lucide-react";
import type { PublicDirectoryItem, PublicDirectoryKind } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { PlatformBadge } from "@/lib/brand/PlatformVisuals";
import { getPlatformBrand } from "@/lib/brand/platform-brands";
import { directoryCopy } from "../directory-copy";

const languages = { ckb: "کوردی", ar: "العربية", en: "English" } as const;

/** Public content previews only: never responses, traffic or conversion totals. */
export function PublicDirectoryCardDetails({ item, kind, locale }: {
  item: PublicDirectoryItem;
  kind: PublicDirectoryKind;
  locale: BusinessLocale;
}) {
  const copy = directoryCopy[locale];
  if (kind === "linktree") {
    if (!item.platforms?.length) return null;
    return <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
      {item.platforms.map((platform) => <span key={platform} className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 py-1 pe-2.5 ps-1 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        <PlatformBadge platform={platform} className="size-6 rounded-full" iconClassName="size-3.5" />{getPlatformBrand(platform).name}
      </span>)}
    </div>;
  }
  if (!item.language && item.requiredQuestionCount === undefined) return null;
  return <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
    {item.language && <span className="inline-flex items-center gap-1.5"><Globe2 aria-hidden className="size-4" /><span lang={item.language}>{languages[item.language]}</span></span>}
    {typeof item.requiredQuestionCount === "number" && <span className="inline-flex items-center gap-1.5"><ListChecks aria-hidden className="size-4" />{item.requiredQuestionCount} {copy.requiredQuestions}</span>}
  </div>;
}
