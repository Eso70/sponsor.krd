import type {
  FormAnalytics,
  PageAnalyticsTotals,
  PageAnalyticsAction,
} from '@linktree/types';

/** Explicit public report fields: never forward raw tracking records or arbitrary metadata. */
export function sharedLinktreeAnalytics(
  summary: PageAnalyticsTotals,
  actions: PageAnalyticsAction[],
) {
  const i = summary.insights;
  return {
    totals: {
      total_views: summary.total_views,
      unique_views: summary.unique_views,
      total_clicks: summary.total_clicks,
      unique_clicks: summary.unique_clicks,
      conversions: summary.conversions,
      conversion_value: summary.conversion_value,
      ...(i
        ? {
            insights: {
              measuredVisits: i.measuredVisits,
              averageActiveSeconds: i.averageActiveSeconds,
              engagedVisits: i.engagedVisits,
              contactActions: i.contactActions,
              contactVisitors: i.contactVisitors,
              confirmedOutcomes: i.confirmedOutcomes,
              valuedOutcomes: i.valuedOutcomes,
              channels: (i.channels ?? []).map(({ name, views }) => ({
                name,
                views,
              })),
              devices: (i.devices ?? []).map(({ name, views }) => ({
                name,
                views,
              })),
              revenue: (i.revenue ?? []).map(({ currency, value }) => ({
                currency,
                value,
              })),
              ...(i.whatsapp
                ? {
                    whatsapp: {
                      opened: i.whatsapp.opened,
                      dismissed: i.whatsapp.dismissed,
                      selected: i.whatsapp.selected,
                      questions: (i.whatsapp.questions ?? []).map((q) => ({
                        id: q.id,
                        label: q.label,
                        historical: q.historical,
                        clicks: q.clicks,
                        uniqueVisitors: q.uniqueVisitors,
                        lastSelectedAt: q.lastSelectedAt,
                        links: q.links.map(({ label, clicks }) => ({
                          label,
                          clicks,
                        })),
                      })),
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
    actions: actions.map((a) => ({
      id: a.id,
      actionKey: a.actionKey,
      label: a.label,
      actionType: a.actionType,
      destination: a.destination,
      recordState: a.recordState,
      totalClicks: a.totalClicks,
      uniqueClickers: a.uniqueClickers,
      conversions: a.conversions,
      conversionValue: a.conversionValue,
      ctr: a.ctr,
      ...(a.metadata?.platform
        ? { metadata: { platform: a.metadata.platform } }
        : {}),
    })),
  };
}

export function sharedFormAnalytics(
  metrics: FormAnalytics,
  includeAnswers: boolean,
): FormAnalytics {
  const i = metrics.insights;
  const distribution = (items: { label: string | null; count: number }[]) =>
    items.map(({ label, count }) => ({ label, count }));
  return {
    views: metrics.views,
    visitors: metrics.visitors,
    starts: metrics.starts,
    submissions: metrics.submissions,
    clicks: metrics.clicks,
    ...(metrics.completion
      ? {
          completion: {
            from: metrics.completion.from,
            to: metrics.completion.to,
            starts: metrics.completion.starts,
            responses: metrics.completion.responses,
            rate: metrics.completion.rate,
          },
        }
      : {}),
    ...(i
      ? {
          insights: {
            averageDurationMs: i.averageDurationMs,
            latestSubmissionAt: i.latestSubmissionAt,
            daily: i.daily.map(({ day, count }) => ({ day, count })),
            sources: distribution(i.sources),
            devices: distribution(i.devices),
            countries: distribution(i.countries),
            sourcePerformance: i.sourcePerformance?.map(
              ({ label, starts, responses, rate }) => ({
                label,
                starts,
                responses,
                rate,
              }),
            ),
            ...(includeAnswers
              ? {
                  answerSummaries: i.answerSummaries?.map((q) => ({
                    questionId: q.questionId,
                    label: q.label,
                    totalAnswers: q.totalAnswers,
                    options: q.options.map(({ label, count, percentage }) => ({
                      label,
                      count,
                      percentage,
                    })),
                  })),
                }
              : {}),
          },
        }
      : {}),
  };
}
