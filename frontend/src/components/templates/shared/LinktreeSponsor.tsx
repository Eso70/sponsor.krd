"use client";

import Image from "next/image";
import type { LinktreeSponsor } from "@linktree/types/linktree-sponsor.cjs";
import { usePublicLinktreeLocale } from "@/features/business/i18n/public-linktree";

const labels = {
  ckb: "سپۆنسەرکراوە لەلایەن",
  ar: "برعاية",
  en: "Sponsored by",
};

/** Shared by every template and its drawer preview. */
export function LinktreeSponsor({ sponsor, preview = false, onClick }: {
  sponsor: LinktreeSponsor;
  preview?: boolean;
  onClick?: (url: string, name: string) => void;
}) {
  const locale = usePublicLinktreeLocale();
  if (!sponsor.enabled || (sponsor.style === "text" && !sponsor.name.trim())) return null;
  const accessibleName = sponsor.name.trim() || ({ en: "Sponsor", ar: "الجهة الراعية", ckb: "سپۆنسەر" } as const)[locale];
  const intro = sponsor.intro ?? labels[locale];
  if (sponsor.style === "wordmark" && !sponsor.logo) return null;
  const content = sponsor.style === "wordmark" && sponsor.logo ? (
    <Image src={sponsor.logo} alt={accessibleName} width={180} height={40} unoptimized
      className="mx-auto h-9 w-auto max-w-[180px] object-contain" />
  ) : <span className="block max-w-[260px] break-words text-sm font-semibold leading-5" dir="auto">{sponsor.name}</span>;
  return (
    <div data-linktree-sponsor lang={locale} dir={locale === "en" ? "ltr" : "rtl"}
      className="mx-auto mb-2 flex max-w-xs flex-col items-center gap-1.5 text-center">
      {intro && <span className="max-w-[260px] break-words text-[11px] leading-4 opacity-70" dir="auto">{intro}</span>}
      {sponsor.url && !preview ? (
        <a href={sponsor.url} rel="sponsored noopener noreferrer" data-page-action="page:sponsor-click"
          className="rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transition-none"
          onClick={() => onClick?.(sponsor.url!, accessibleName)}>
          {content}
        </a>
      ) : <div>{content}</div>}
    </div>
  );
}
