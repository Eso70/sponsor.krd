import {
  sharedLinktreeAnalytics,
  sharedFormAnalytics,
} from './analytics-sharing-projection';
import type {
  FormAnalytics,
  PageAnalyticsTotals,
  PageAnalyticsAction,
} from '@linktree/types';

describe('drawer-compatible shared analytics projection', () => {
  it('preserves complete aggregate insights, WhatsApp questions, action metrics and source ordering without leaking raw fields', () => {
    const insights = {
      measuredVisits: 9,
      averageActiveSeconds: 31,
      engagedVisits: 5,
      contactActions: 7,
      contactVisitors: 4,
      confirmedOutcomes: 2,
      valuedOutcomes: 1,
      channels: [{ name: 'direct', views: 5, visitorId: 'private' }],
      devices: [{ name: 'mobile', views: 8 }],
      revenue: [{ currency: 'IQD', value: 2000 }],
      whatsapp: {
        opened: 6,
        dismissed: 2,
        selected: 4,
        questions: [
          {
            id: 'q1',
            label: 'Price',
            historical: true,
            clicks: 4,
            uniqueVisitors: 3,
            lastSelectedAt: null,
            links: [{ label: 'Sales', clicks: 4, visitorId: 'private' }],
            visitorId: 'private',
          },
        ],
      },
      visitorId: 'private',
    };
    const totals: PageAnalyticsTotals = {
      total_views: 15,
      unique_views: 9,
      total_clicks: 12,
      unique_clicks: 6,
      conversions: 7,
      conversion_value: 0,
      insights,
    };
    const actions: PageAnalyticsAction[] = Array.from(
      { length: 65 },
      (_, index) => ({
        id: String(index),
        actionKey: `link:${index}`,
        label: `Link ${index}`,
        actionType: 'custom',
        destination: 'https://example.com',
        totalClicks: index + 1,
        uniqueClickers: 1,
        conversions: 1,
        conversionValue: 0,
        ctr: 1.2,
        recordState: 'historical',
        metadata: { platform: 'whatsapp', arbitrary: 'private' },
      }),
    );
    const result = sharedLinktreeAnalytics(totals, actions);
    expect(result.actions).toHaveLength(65);
    expect(result.actions.map((a) => a.id)).toEqual(actions.map((a) => a.id));
    expect(result.actions[0]).toMatchObject({
      conversions: 1,
      ctr: 1.2,
      recordState: 'historical',
      metadata: { platform: 'whatsapp' },
    });
    expect(result.totals.insights).toMatchObject({
      averageActiveSeconds: 31,
      whatsapp: {
        selected: 4,
        questions: [
          { label: 'Price', clicks: 4, links: [{ label: 'Sales', clicks: 4 }] },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/private|visitorId|arbitrary/);
  });
  it('shares form metrics and distributions but gates answer summaries with the response permission', () => {
    const metrics: FormAnalytics = {
      views: 20,
      visitors: 15,
      starts: 10,
      submissions: 5,
      clicks: 9,
      completion: {
        from: '2026-10-01',
        to: '2026-10-20',
        starts: 10,
        responses: 5,
        rate: 50,
      },
      insights: {
        averageDurationMs: 25000,
        latestSubmissionAt: null,
        daily: [{ day: '2026-10-20', count: 5 }],
        sources: [{ label: 'direct', count: 5 }],
        devices: [],
        countries: [],
        sourcePerformance: [
          { label: 'direct', starts: 10, responses: 5, rate: 50 },
        ],
        answerSummaries: [
          {
            questionId: 'q1',
            label: 'Name',
            totalAnswers: 1,
            options: [{ label: 'Client', count: 1, percentage: 100 }],
          },
        ],
      },
    };
    expect(sharedFormAnalytics(metrics, true)).toEqual(metrics);
    const result = sharedFormAnalytics(metrics, false);
    expect(result.insights?.answerSummaries).toBeUndefined();
    expect(result.completion).toEqual(metrics.completion);
    expect(result.insights?.sourcePerformance).toEqual(
      metrics.insights?.sourcePerformance,
    );
    expect(JSON.stringify(result)).not.toContain('Client');
  });
});
