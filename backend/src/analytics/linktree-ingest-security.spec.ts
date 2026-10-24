import { ConfigService } from '@nestjs/config';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { UnifiedAnalyticsService } from './unified-analytics.service';

function fixture() {
  const query = jest.fn((sql: string) => {
    if (sql.includes('FROM public_pages'))
      return Promise.resolve({
        rows: [
          {
            id: 'page',
            business_id: 'owner',
            page_type: 'linktree',
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
  return { service, query };
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
