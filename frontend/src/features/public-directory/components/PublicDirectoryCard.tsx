import { ArrowUpRight, Star } from "lucide-react";
import type { PublicDirectoryItem, PublicDirectoryKind } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { ManagementCard } from "@/components/shared/ManagementCard";
import { PageListCardMedia } from "@/components/shared/PageListCardMedia";
import { PageListBanner } from "@/components/shared/PageListBanner";
import { PageListCardHeader } from "@/components/shared/PageListCardHeader";
import { PageListDescription } from "@/components/shared/PageListDescription";
import { PageListActions } from "@/components/shared/PageListActions";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { pageListLogo } from "@/components/shared/page-list-logo";
import { FormCollectionBanner } from "@/features/forms/components/FormCollectionBanner";
import { directoryHref } from "../directory-navigation";
import { directoryCopy } from "../directory-copy";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { LinktreePill } from "@/features/link-editor/components/LinktreeMeta";
import { PublicDirectoryCardCover } from "./PublicDirectoryCardCover";
import { PublicDirectoryCardDetails } from "./PublicDirectoryCardDetails";

export function PublicDirectoryCard({ item, kind, campaignQuery, locale, origin }: {
  item: PublicDirectoryItem;
  kind: PublicDirectoryKind;
  origin: string;
  campaignQuery: string;
  locale: BusinessLocale;
}) {
  const copy = directoryCopy[locale];
  const title = item.title || (kind === "form" ? copy.untitledForm : copy.page);
  const openLabel = kind === "form" ? copy.openForm : copy.exploreLinks;
  const path = `/${kind}/${encodeURIComponent(item.slug)}`;
  const href = directoryHref(path, campaignQuery);
  return (
    <ManagementCard intrinsicHeight={480} className="text-center" media={
      <PageListCardMedia>
        {!item.bannerImages?.length ? <PublicDirectoryCardCover kind={kind} /> : kind === "form"
          ? <FormCollectionBanner form={{ bannerImages: item.bannerImages, bannerMode: item.bannerMode }} locale={locale} />
          : <PageListBanner src={item.bannerImages?.[0]} />}
      </PageListCardMedia>
    }>
      <PageListCardHeader name={title} size="large" logo={pageListLogo(item.logo)} subtitle={kind === "form" ? copy.untitledForm : copy.page} badges={
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {typeof item.contentCount === "number" && <LinktreePill label={`${item.contentCount} ${kind === "form" ? copy.questionsCount : copy.linksCount}`} className="border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" />}
          {item.isDefault && <LinktreePill label={copy.mainPage} icon={<Star aria-hidden className="size-3" />} className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" />}
        </div>
      } />
      <PageListDescription size="large" clamp={false}>{item.description?.trim() || (kind === "form" ? copy.formFallback : null)}</PageListDescription>
      <PublicDirectoryCardDetails item={item} kind={kind} locale={locale} />
      {kind === "linktree" && <PageListDescription size="large" clamp={false}>{copy.linktreeGuidance}</PageListDescription>}
      <div className="mt-auto pt-2">
        <PageListUrl url={origin ? new URL(href, origin).href : href} displayUrl={`/${kind}/${item.slug}`} labels={copy} boxed newTab={false} />
        <PageListActions variant="grid">
        <GridCardActionButton label={`${openLabel}: ${title}`} text={openLabel} showLabel size="large" icon={ArrowUpRight} tone="purple"
          href={href} />
        </PageListActions>
      </div>
    </ManagementCard>
  );
}
