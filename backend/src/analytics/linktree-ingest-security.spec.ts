import { ConfigService } from '@nestjs/config';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { UnifiedAnalyticsService } from './unified-analytics.service';

function fixture(
  actionOverrides: Record<string, unknown> = {},
  pageType = 'linktree',
) {
  const query = jest.fn((sql: string) => {
    if (sql.includes('FROM public_pages'))
      return Promise.resolve({
        rows: [
          {
            id: 'page',
            business_id: 'owner',
            page_type: pageType,
            timezone: 'Asia/Baghdad',
            name: 'Page',
          },
        ],
      });
    if (sql.includes('FROM public_page_actions'))
      return Promise.resolve({
        rows: [
          {
            id: 'action',
            label: 'WhatsApp',
            action_type: 'whatsapp',
            tiktok_event: 'Contact',
            ...actionOverrides,
          },
        ],
      });
    return Promise.resolve({ rows: [{ id: 'row' }] });
  });
  const client = { query } as unknown as PoolClient;
  const database = {
    transaction: (fn: (client: PoolClient) => Promise<unknown>) => fn(client),
  } as unknown as DatabaseService;
  const service = new UnifiedAnalyticsService(database, {
    get: () => 's'.repeat(32),
  } as unknown as ConfigService);
  return { service, query, client };
}
const input = {
  eventId: '11111111-1111-4111-8111-111111111111',
  pageId: '22222222-2222-4222-8222-222222222222',
  actionId: '33333333-3333-4333-8333-333333333333',
  visitorId: 'visitor-key',
  sessionId: 'session-key',
  occurredAt: new Date().toISOString(),
};
const context = { ip: '203.0.113.9', userAgent: 'Mozilla/5.0' };
describe('Linktree outcome integrity', () => {
  it.each([
    [undefined, 'https://site.example/linktree/page', 'direct'],
    ['', 'https://site.example/linktree/page', 'direct'],
    [
      'https://www.tiktok.com/',
      'https://site.example/linktree/page',
      'tiktok_organic',
    ],
  ] as const)(
    'uses the landing referrer %s instead of the tracking request header',
    async (referrer, requestReferrer, channel) => {
      const { service, query } = fixture();
      await service.ingest(
        {
          ...input,
          eventName: 'page_view',
          pageUrl: 'https://site.example/linktree/page',
          referrer,
        },
        { ...context, referrer: requestReferrer },
      );
      const event = query.mock.calls.find(([sql]) =>
        sql.includes('INSERT INTO analytics_events'),
      );
      const values = (event as unknown as [string, unknown[]])[1];
      expect(values[9]).toBe(referrer || null);
      expect(values[34]).toBe(channel);
      const session = query.mock.calls.find(([sql]) =>
        sql.includes('INSERT INTO analytics_sessions'),
      );
      expect((session as unknown as [string, unknown[]])[1][6]).toBe(
        referrer || null,
      );
    },
  );

  it('counts an accepted server-side form submission in events and both rollups', async () => {
    const { service, query, client } = fixture(
      { action_type: 'form', tiktok_event: 'SubmitForm' },
      'form',
    );
    await service.ingest(
      { ...input, eventName: 'form_submit' },
      context,
      client,
    );
    const event = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO analytics_events'),
    );
    expect((event as unknown as [string, unknown[]])[1][26]).toBe(true);
    for (const table of ['analytics_page_daily', 'analytics_action_daily']) {
      const rollup = query.mock.calls.find(([sql]) =>
        sql.includes(`INSERT INTO ${table}`),
      );
      expect((rollup as unknown as [string, unknown[]])[1][6]).toBe(1);
    }
  });
  it.each([
    ['button_click', {}, true],
    ['whatsapp_click', { metadata: { engagement_only: true } }, false],
  ] as const)(
    'keeps stored and rolled-up conversions consistent for %s',
    async (eventName, action, expected) => {
      const { service, query } = fixture(action);
      await service.ingest({ ...input, eventName }, context);
      const event = query.mock.calls.find(([sql]) =>
        sql.includes('INSERT INTO analytics_events'),
      );
      expect((event as unknown as [string, unknown[]])[1][26]).toBe(expected);
      for (const table of ['analytics_page_daily', 'analytics_action_daily']) {
        const rollup = query.mock.calls.find(([sql]) =>
          sql.includes(`INSERT INTO ${table}`),
        );
        expect((rollup as unknown as [string, unknown[]])[1][6]).toBe(
          expected ? 1 : 0,
        );
      }
    },
  );

  it('ignores browser revenue and takes the registered marketing name', async () => {
    const { service, query } = fixture();
    await service.ingest(
      {
        ...input,
        eventName: 'whatsapp_click',
        conversionValue: 999,
        currency: 'USD',
        browserDispatched: true,
        browserEventName: 'CompletePayment',
      },
      context,
    );
    const event = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO analytics_events'),
    );
    const values = (event as unknown as [string, unknown[]])[1];
    expect(values[27]).toBeNull();
    expect(values[28]).toBeNull();
    const outbox = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO marketing_event_outbox'),
    );
    const args = (outbox as unknown as [string, unknown[]])[1];
    expect(args[2]).toBe('Contact');
    expect(args[5]).toBe(false);
    const payload = JSON.parse(args[4] as string) as Record<string, unknown>;
    expect(payload.value).toBeUndefined();
    expect(payload.currency).toBeUndefined();
  });
  it.each([
    'lead_created',
    'order_completed',
    'form_submit',
    'checkout_started',
  ] as const)('rejects browser claims of %s', async (eventName) => {
    const { service } = fixture();
    await expect(
      service.ingest({ ...input, eventName }, context),
    ).rejects.toMatchObject({ status: 400 });
  });
});
