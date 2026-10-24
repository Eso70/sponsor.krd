"use client";
import type { ReactNode } from "react";
import type { SharedPageAnalytics } from "@linktree/types";
import { PageAnalyticsSkeleton } from "@/features/analytics/components/PageAnalyticsSkeleton";
import { PageAnalyticsContent } from "@/features/analytics/components/PageAnalyticsContent";
import { pageAnalyticsCopy } from "@/features/analytics/page-analytics-copy";
import { FormAnalyticsOverview } from "@/features/forms/components/FormAnalyticsOverview";
import { formsCopy } from "@/features/forms/forms-copy";
import { SharedFormResponses } from "./SharedFormResponses";
import { type SharingLocale } from "../sharing-copy";

export function SharedAnalyticsReport({
  data,
  locale,
  apiBase,
  onAccessLost,
  rangeControl,
  pending = false,
}: {
  data: SharedPageAnalytics;
  locale: SharingLocale;
  apiBase: string;
  onAccessLost: () => void;
  rangeControl?: ReactNode;
  pending?: boolean;
}) {
  const formCopy = formsCopy(locale);
  return (
    <div className="space-y-5">
      {data.pageType === "linktree" && data.linktreeAnalytics && (
        <div className="space-y-5">
          {pending ? (
            <>
              {rangeControl}
              <PageAnalyticsSkeleton showRange={false} locale={locale} />
            </>
          ) : (
            <PageAnalyticsContent
              totals={data.linktreeAnalytics.totals}
              actions={data.linktreeAnalytics.actions}
              pageId={apiBase}
              locale={locale}
              labels={pageAnalyticsCopy(locale)}
              rangeControl={rangeControl}
            />
          )}
        </div>
      )}
      {data.pageType === "form" && data.formAnalytics && (
        <section aria-label={formCopy.analytics}>
          <FormAnalyticsOverview
            title={data.name}
            metrics={data.formAnalytics}
            copy={formCopy}
            locale={locale}
          />
        </section>
      )}
      {data.pageType === "form" && data.responses && (
        <section aria-label={formCopy.submissions} className="space-y-4">
          <SharedFormResponses
            apiBase={apiBase}
            initialData={data.responses}
            name={data.name}
            definition={data.exportDefinition}
            locale={locale}
            onAccessLost={onAccessLost}
          />
        </section>
      )}
    </div>
  );
}
