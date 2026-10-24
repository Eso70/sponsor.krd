import { mockArg } from '../common/test-utils';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import {
  UnifiedAnalyticsService,
  forwardsToTikTok,
  isAnalyticsBotUserAgent,
} from './unified-analytics.service';

describe('authoritative event naming', () => {
  it('reads the registered action event instead of trusting a browser sale claim', () => {
    const service = buildService() as unknown as {
      tiktokEvent: (event: string, action: { tiktok_event: string }) => string;
    };
    expect(
      service.tiktokEvent('whatsapp_click', { tiktok_event: 'Contact' }),
    ).toBe('Contact');
    expect(
      service.tiktokEvent('service_click', { tiktok_event: 'Contact' }),
    ).toBe('Contact');
  });
});

/**
 * Which events are allowed to reach TikTok at all.
 *
 * `trackEngagement` reports a section opening or a scroll-depth milestone with
 * no registered action, which is what stops the browser firing a pixel for it.
 * The server had no matching rule and forwarded them anyway, so engagement
 * arrived as a server-only `ClickButton` with no browser event to deduplicate
 * against — and `form_view` arrived as a second `ViewContent` on top of the
 * page's own. See docs/tracking.md.
 */
describe('forwardsToTikTok', () => {
  it('does not promote custom activity into a registered contact conversion', () => {
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'custom',
        hasAction: true,
      }),
    ).toBe(false);
  });
  it('keeps registered media engagement out of conversion delivery', () => {
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'action_open',
        hasAction: true,
        engagementOnly: true,
      }),
    ).toBe(false);
  });
  it('forwards public form views and accepted submissions, but not starts', () => {
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'page_view',
        hasAction: false,
      }),
    ).toBe(true);
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'form_submit',
        hasAction: true,
      }),
    ).toBe(true);
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'form_view',
        hasAction: false,
      }),
    ).toBe(false);
  });
  it('does not turn public form activity into checkout or unregistered button conversions', () => {
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'checkout_started',
        hasAction: true,
      }),
    ).toBe(false);
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'button_click',
        hasAction: false,
      }),
    ).toBe(false);
    expect(
      forwardsToTikTok({
        pageType: 'form',
        eventName: 'button_click',
        hasAction: true,
      }),
    ).toBe(true);
  });
  it('does not forward a fixed public route', () => {
    expect(
      forwardsToTikTok({
        pageType: 'route',
        eventName: 'page_view',
        hasAction: false,
      }),
    ).toBe(false);
  });

  it('forwards a conversion that resolved to a registered action', () => {
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'whatsapp_click',
        hasAction: true,
      }),
    ).toBe(true);
  });

  it('drops engagement that fired no pixel', () => {
    for (const eventName of [
      'engaged_view',
      'action_open',
      'form_view',
    ] as const) {
      expect(
        forwardsToTikTok({
          pageType: 'linktree',
          eventName,
          hasAction: false,
        }),
      ).toBe(false);
    }
  });

  it('keeps registered engagement internal', () => {
    // The browser fires the pixel whenever the key resolves to a registered
    // action, so dropping the server half here would break the pair.
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'action_open',
        hasAction: true,
      }),
    ).toBe(false);
  });

  it('does not forward unregistered shares', () => {
    // Sharing is a conversion, so `share` must stay out of the engagement set.
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'share',
        hasAction: false,
      }),
    ).toBe(false);
  });

  it('forwards a server-recorded lead that has no action row', () => {
    // A lead form can ingest `form_submit` with no `actionId`; it remains a
    // conversion and must not be filtered out.
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'lead_created',
        hasAction: false,
        serverConfirmed: true,
      }),
    ).toBe(true);
  });

  it('forwards the page view that pairs with the pixel ViewContent', () => {
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'page_view',
        hasAction: false,
      }),
    ).toBe(true);
  });
});

describe('analytics bot detection', () => {
  it('does not classify CUBOT Android phones as bots', () => {
    expect(
      isAnalyticsBotUserAgent(
        'Mozilla/5.0 (Linux; Android 10; CUBOT_NOTE_20 Build/QP1A)',
      ),
    ).toBe(false);
  });

  it('still classifies known crawlers and generic bot tokens', () => {
    expect(isAnalyticsBotUserAgent('facebookexternalhit/1.1')).toBe(true);
    expect(isAnalyticsBotUserAgent('Example-Bot/1.0')).toBe(true);
  });
});

describe('action resolution', () => {
  it('accepts an archived action that still belongs to the page', async () => {
    const service = buildService();
    const action = {
      id: 'action-id',
      label: 'Old button',
      action_type: 'button',
      tiktok_event: 'ClickButton',
    };
    const client = { query: jest.fn().mockResolvedValue({ rows: [action] }) };

    const result = await (
      service as unknown as {
        resolveAction: (
          client: unknown,
          pageId: string,
          actionId: string,
        ) => Promise<unknown>;
      }
    ).resolveAction(client, 'page-id', 'action-id');

    expect(result).toEqual(action);
    expect(mockArg<string>(client.query, 0, 0)).not.toContain(
      "status = 'active'",
    );
  });

  it('keeps an unknown or cross-page action detached from action rollups', async () => {
    const service = buildService();
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };

    await expect(
      (
        service as unknown as {
          resolveAction: (
            client: unknown,
            pageId: string,
            actionId: string,
          ) => Promise<unknown>;
        }
      ).resolveAction(client, 'page-id', 'other-action-id'),
    ).resolves.toBeNull();
  });
});

function buildService(database: unknown = {}) {
  const config = { get: () => 'x'.repeat(32) };
  return new UnifiedAnalyticsService(
    database as DatabaseService,
    config as unknown as ConfigService,
  );
}

describe('tracked redirect destinations', () => {
  it('resolves only the registered HTTP destination', async () => {
    const database = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ destination: 'https://wa.me/9647500000000' }],
      }),
    };
    const service = buildService(database);

    await expect(
      service.resolveRedirectDestination('page-id', 'action-id'),
    ).resolves.toBe('https://wa.me/9647500000000');

    const query = mockArg<string>(database.query, 0, 0);
    expect(query).toContain('action.id = $2::uuid');
    expect(query).toContain('page.source_linktree_id = $1::uuid');
    expect(query).not.toContain('destination = $');
  });

  it('refuses a stored non-http destination', async () => {
    const database = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ destination: 'javascript:alert(1)' }],
      }),
    };
    const service = buildService(database);

    await expect(
      service.resolveRedirectDestination('page-id', 'action-id'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('preserves a WhatsApp preset without allowing the target to change', async () => {
    const database = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ destination: 'https://wa.me/9647500000000' }],
      }),
    };
    const service = buildService(database);

    await expect(
      service.resolveRedirectDestination(
        'page-id',
        'action-id',
        'I want the holiday offer',
      ),
    ).resolves.toBe(
      'https://wa.me/9647500000000?text=I+want+the+holiday+offer',
    );
  });
});

describe('analytics rollups', () => {
  it('writes only additive totals and leaves exact uniques to the event log', async () => {
    const service = buildService();
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };

    await (
      service as unknown as {
        updateRollups: (
          client: unknown,
          input: {
            page: {
              id: string;
              business_id: string;
              page_type: 'linktree';
              timezone: string;
              name: string;
              slug: string;
            };
            action: null;
            eventName: 'page_view';
            occurredAt: string;
            conversionValue: number;
          },
        ) => Promise<void>;
      }
    ).updateRollups(client, {
      page: {
        id: 'page-1',
        business_id: 'business-1',
        page_type: 'linktree',
        timezone: 'Asia/Baghdad',
        name: 'Page',
        slug: 'page',
      },
      action: null,
      eventName: 'page_view',
      occurredAt: '2026-07-31T00:00:00.000Z',
      conversionValue: 0,
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    const pageDailyInsert = mockArg<string>(client.query, 0, 0);
    expect(pageDailyInsert).not.toContain('new_visitors');
    expect(pageDailyInsert).not.toContain('new_clickers');
    expect(pageDailyInsert).not.toContain('unique_visitors');
    expect(pageDailyInsert).not.toContain('unique_clickers');
  });
});

describe('getSummary uniques', () => {
  it('reads unique views/clickers from analytics_events, not the daily rollup', async () => {
    const database = {
      query: jest
        .fn()
        .mockResolvedValue({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              total_views: '100',
              total_clicks: '40',
              conversions: '5',
              conversion_value: '250',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ unique_views: '37', unique_clickers: '12' }],
        }),
    };
    const service = buildService(database);

    const summary = await service.getSummary('business-1', {});

    expect(summary.total_views).toBe(100);
    expect(summary.unique_views).toBe(37);
    expect(summary.unique_visitors).toBe(37);
    expect(summary.unique_clicks).toBe(12);
    expect(summary.unique_clickers).toBe(12);

    const uniquenessQuery = mockArg<string>(database.query, 1, 0);
    expect(uniquenessQuery).toContain('analytics_events');
    expect(uniquenessQuery).toMatch(/COUNT\(DISTINCT/);
  });
});

describe('getDaily uniques', () => {
  /**
   * A per-day trend point needs "how many distinct people were active that
   * day", computed live per day from the event log.
   */
  it('computes getDaily uniques from the event log, not the daily rollup', async () => {
    const database = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }),
    };
    const service = buildService(database);

    await service.getDaily('business-1', 'page-1', 30);

    const query = mockArg<string>(database.query, 0, 0);
    expect(query).not.toContain('daily.unique_visitors');
    expect(query).not.toContain('daily.unique_clickers');
    expect(query).toContain('day_uniques AS');
    expect(query).toContain('COUNT(DISTINCT event.visitor_id)');
    expect(query).toContain('AT TIME ZONE page.timezone');
    expect(query).toContain('target.local_today');
  });
});
