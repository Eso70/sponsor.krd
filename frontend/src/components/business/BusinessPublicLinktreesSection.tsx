import { BusinessPublicLinktreeCard } from "@/components/business/BusinessPublicLinktreeCard";
import type { PublicBusinessLinktree } from "@/components/business/BusinessPublicLinktreeCard";
import { BUSINESS_LANDING_SECTION_IDS } from "@/components/business/business-landing-sections";
import { PublicSection } from "@/components/public/PublicSection";
import { PublicSectionHeading } from "@/components/public/PublicSectionHeading";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";

export function BusinessPublicLinktreesSection({
  linktrees,
  locale = "ckb",
}: {
  linktrees: PublicBusinessLinktree[];
  locale?: BusinessLocale;
}) {
  return (
    <PublicSection
      id={BUSINESS_LANDING_SECTION_IDS.workspace}
      labelledBy="business-public-linktrees-title"
      className="pt-12 sm:pt-16 lg:pt-20"
      direction="ltr"
      contentClassName="max-w-6xl"
    >
      <PublicSectionHeading
        id="business-public-linktrees-title"
        title={businessPublicCopy[locale].publishedPages}
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {linktrees.map((linktree) => (
          <BusinessPublicLinktreeCard key={linktree.id} linktree={linktree} locale={locale} />
        ))}
      </div>
    </PublicSection>
  );
}
