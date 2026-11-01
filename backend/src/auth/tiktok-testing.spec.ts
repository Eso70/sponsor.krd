import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TikTokPixelConfigService } from './tiktok-pixel-config.service';
import { TestTikTokEventsApiDto } from '../analytics/dto/test-tiktok-events-api.dto';

const pageId = '11111111-1111-4111-8111-111111111111';
const input = {
  pixel_id: 'PIXEL_TEST',
  test_event_code: 'TEST31402',
  page_id: pageId,
  event_name: 'SubmitForm' as const,
};
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function fixture(account_type = 'business', page_type = 'form') {
  const page = {
    id: pageId,
    name: 'Application',
    slug: 'application',
    page_type,
    account_type,
    subdomain: 'tenant',
    action_id: 'action-id',
  };
  const query = jest
    .fn()
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'pixel',
          pixel_id: 'PIXEL_TEST',
          encrypted_events_token: Buffer.from('encrypted'),
        },
      ],
    })
    .mockResolvedValue({ rows: [page] });
  const service = new TikTokPixelConfigService(
    { query } as never,
    { decryptJson: () => ({ events_token: 'token' }) } as never,
    { get: () => 'https://sponsor.krd' } as never,
  );
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ code: 0, message: 'OK' }),
  });
  global.fetch = fetchMock;
  return { service, query, fetchMock };
}

describe('owner-scoped TikTok server tests', () => {
  it.each(['business', 'platform'])(
    'sends a form test in the %s workspace with its canonical URL and registered action',
    async (owner) => {
      const { service, query, fetchMock } = fixture(owner);
      expect((await service.testEventsApi('owner', input)).success).toBe(true);
      const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
      const body = JSON.parse(options.body) as {
        test_event_code: string;
        event_source_id: string;
        data: Array<{ event_id: string }>;
      };
      expect(body.test_event_code).toBe('TEST31402');
      expect(body.event_source_id).toBe('PIXEL_TEST');
      expect(body.data[0]).toMatchObject({
        event: 'SubmitForm',
        page: {
          url: `https://${owner === 'business' ? 'tenant.' : ''}sponsor.krd/form/application`,
        },
        properties: { content_id: 'action-id' },
      });
      expect(body.data[0].event_id).toMatch(/^[a-f0-9-]{36}$/);
      const [sql, parameters] = query.mock.calls[1] as [string, unknown[]];
      expect(parameters).toEqual(['owner', pageId, null, 'SubmitForm']);
      expect(sql).toContain('page.business_id=$1');
    },
  );
  it.each(['ViewContent', 'Contact', 'ClickButton'] as const)(
    'supports %s on Linktrees',
    async (event_name) => {
      const { service } = fixture('business', 'linktree');
      expect(
        (await service.testEventsApi('owner', { ...input, event_name }))
          .success,
      ).toBe(true);
    },
  );
  it('rejects SubmitForm on a Linktree before sending', async () => {
    const { service, fetchMock } = fixture('business', 'linktree');
    await expect(service.testEventsApi('owner', input)).rejects.toThrow(
      'SubmitForm requires a form',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects foreign, paused and unpublished page IDs without sending', async () => {
    const { service, query, fetchMock } = fixture();
    query.mockResolvedValue({ rows: [] });
    // Preserve the configured owned Pixel; the page lookup returns no eligible row.
    await expect(service.testEventsApi('owner', input)).rejects.toThrow(
      'Select an active published',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    '{}',
    'null',
    '<html>Proxy error</html>',
    '{"code":40002,"message":"Invalid parameter"}',
  ])(
    'does not report an invalid acknowledgement as delivered: %s',
    async (response) => {
      const { service, fetchMock } = fixture();
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => response,
      });
      expect((await service.testEventsApi('owner', input)).success).toBe(false);
    },
  );
  it('accepts form test DTOs and rejects invalid IDs/events', () => {
    const validate = (value: unknown) =>
      validateSync(plainToInstance(TestTikTokEventsApiDto, value), {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    expect(validate(input)).toHaveLength(0);
    expect(validate({ ...input, page_id: 'foreign-url' })).not.toHaveLength(0);
    expect(validate({ ...input, event_name: 'Purchase' })).not.toHaveLength(0);
  });
});
