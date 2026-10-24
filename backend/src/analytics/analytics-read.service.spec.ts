import { DatabaseService } from '../database/database.service';
import { AnalyticsReadService } from './analytics-read.service';

describe('AnalyticsReadService', () => {
  it('counts one accepted conversion across multiple Pixel destinations while retaining delivery counts', async () => {
    const query = jest.fn((_sql: string, _values?: unknown[]) =>
      Promise.resolve({
        rows: [
          {
            connections: '2',
            browser_events: '2',
            queued_events: '2',
            delivered: '2',
            retrying: '0',
            failed: '0',
            internal_conversions: '1',
            conversion_deliveries: '1',
            last_delivered_at: null,
          },
        ],
      }),
    );
    const service = new AnalyticsReadService({
      query,
    } as unknown as DatabaseService);
    const owner = '373f02f3-0b8b-4e93-ad0b-5f16a640daf4';
    const health = await service.getTikTokHealth(owner, {});
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('COUNT(DISTINCT outbox.analytics_event_id) FILTER');
    expect(sql).toContain(
      "COUNT(outbox.id) FILTER (WHERE outbox.status = 'delivered')",
    );
    expect(values?.[0]).toBe(owner);
    expect(health.delivered).toBe(2);
    expect(health.reconciliation).toEqual({
      internalConversions: 1,
      serverAcceptedConversions: 1,
    });
  });
  it('keeps clicked historical and unattributed actions visible in button analytics', async () => {
    let capturedSql = '';
    const query = jest.fn((sql: string) => {
      capturedSql = sql;
      return Promise.resolve({ rows: [] });
    });
    const database = { query } as unknown as DatabaseService;
    const service = new AnalyticsReadService(database);

    await service.getActions('373f02f3-0b8b-4e93-ad0b-5f16a640daf4', {
      pageId: '17fdf0e8-d6b4-449a-b3cf-c760160c3f21',
    });

    expect(capturedSql).toContain("THEN 'historical'");
    expect(capturedSql).toContain('unattributed_totals AS');
    expect(capturedSql).toContain('event.public_page_action_id IS NULL');
    expect(capturedSql).toContain('event.is_bot = false');
    expect(capturedSql).toContain("'unattributed'::text AS record_state");
    expect(capturedSql).toContain(
      'OR GREATEST(COALESCE(totals.total_clicks, 0), COALESCE(unique_totals.total_clicks, 0)) > 0',
    );
  });

  /**
   * `analytics_action_daily.unique_clickers` only marks a visitor's
   * first-ever click, so summing it over a date range would answer "new
   * clickers in range", not "active unique clickers in range" — the
   * per-action breakdown needs the latter, computed straight from the
   * event log.
   */
  it("computes each action's unique clickers from the event log, not the daily rollup sum", async () => {
    let capturedSql = '';
    let capturedValues: unknown[] = [];
    const query = jest.fn((sql: string, values?: unknown[]) => {
      capturedSql = sql;
      capturedValues = values || [];
      return Promise.resolve({ rows: [] });
    });
    const database = { query } as unknown as DatabaseService;
    const service = new AnalyticsReadService(database);

    await service.getActions('373f02f3-0b8b-4e93-ad0b-5f16a640daf4', {
      pageId: '17fdf0e8-d6b4-449a-b3cf-c760160c3f21',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(capturedSql).not.toContain('SUM(daily.unique_clickers)');
    expect(capturedSql).toContain('unique_totals AS');
    expect(capturedSql).toContain('COUNT(DISTINCT event.visitor_id)');
    expect(capturedSql).toContain('event.is_bot = false');
    expect(capturedSql).toContain(
      'COUNT(*) FILTER (WHERE event.event_name = ANY($6::varchar[]))::bigint AS total_clicks',
    );
    expect(capturedSql).toContain(
      'GREATEST(COALESCE(totals.total_clicks, 0), COALESCE(unique_totals.total_clicks, 0))',
    );
    expect(capturedSql).toContain(
      'LEFT JOIN unique_totals ON unique_totals.public_page_action_id = action.id',
    );
    // The click-events set is passed as the last bound param.
    expect(Array.isArray(capturedValues[capturedValues.length - 1])).toBe(true);
  });

  it("computes each page's unique views/clickers from the event log, not the daily rollup sum", async () => {
    let capturedSql = '';
    let capturedValues: unknown[] = [];
    const query = jest.fn((sql: string, values?: unknown[]) => {
      capturedSql = sql;
      capturedValues = values || [];
      return Promise.resolve({ rows: [] });
    });
    const database = { query } as unknown as DatabaseService;
    const service = new AnalyticsReadService(database);

    await service.getPages('373f02f3-0b8b-4e93-ad0b-5f16a640daf4');

    expect(capturedSql).not.toContain('SUM(daily.unique_visitors)');
    expect(capturedSql).not.toContain('SUM(daily.unique_clickers)');
    expect(capturedSql).toContain('unique_views AS (');
    expect(capturedSql).toContain('unique_clicks AS (');
    expect(capturedSql).toContain('COUNT(DISTINCT event.visitor_id)');
    expect(Array.isArray(capturedValues[1])).toBe(true);
  });

  it("computes a linktree's unique views/clicks from the event log, not the daily rollup sum", async () => {
    // getLinktreeDetails loads its summary and action rows concurrently, so
    // find the summary by its distinguishing CTE rather than call order.
    const query = jest.fn((sql: string) =>
      Promise.resolve({ rows: sql.includes('resolved_page AS') ? [{}] : [] }),
    );
    const database = { query } as unknown as DatabaseService;
    const service = new AnalyticsReadService(database);

    await service.getLinktreeDetails(
      '373f02f3-0b8b-4e93-ad0b-5f16a640daf4',
      '17fdf0e8-d6b4-449a-b3cf-c760160c3f21',
    );

    const summaryCall = query.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('resolved_page AS'),
    );
    expect(summaryCall).toBeDefined();
    const summarySql = summaryCall?.[0] as string;
    expect(summarySql).not.toContain('SUM(daily.unique_visitors)');
    expect(summarySql).not.toContain('SUM(daily.unique_clickers)');
    expect(summarySql).toContain('COUNT(DISTINCT event.visitor_id)');
  });
});
