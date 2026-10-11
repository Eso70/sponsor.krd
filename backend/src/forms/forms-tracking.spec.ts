import { randomUUID } from 'crypto';
import type { FormDraft } from '@linktree/types';
import { FormsService } from './forms.service';
import { DatabaseService } from '../database/database.service';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { StorageService } from '../storage/storage.service';
import { UnifiedAnalyticsService } from '../analytics/unified-analytics.service';
import { PublicPageAnalyticsService } from '../analytics/public-page-analytics.service';
import { PRIVACY_VERSION } from '../common/legal-versions';

const form: FormDraft = {
  id: randomUUID(),
  name: 'Contact',
  headline: '',
  status: 'active',
  layout: 'form',
  language: 'en',
  appearance: 'light',
  description: '',
  purpose: '',
  banner: '',
  logo: '',
  blocks: [],
  questions: [],
  consentRequired: true,
  finalTitle: '',
  finalDescription: '',
  buttonText: '',
  buttonUrl: '',
  updatedAt: new Date().toISOString(),
};

function fixture(owner: string, duplicate = false) {
  const client = {
    query: jest.fn(async (sql: string) => {
      if (sql.startsWith('SELECT form.*'))
        return {
          rows: [
            {
              ...form,
              business_id: owner,
              slug: 'contact',
              definition: form,
              revision: 1,
              updated_at: form.updatedAt,
            },
          ],
        };
      if (sql.startsWith('SELECT id FROM form_submissions'))
        return { rows: duplicate ? [{ id: 'receipt' }] : [] };
      if (sql.startsWith('INSERT INTO form_submissions'))
        return { rows: [{ id: 'receipt' }] };
      if (sql.startsWith('SELECT action.id'))
        return { rows: [{ id: randomUUID() }] };
      return { rows: [] };
    }),
  };
  const db = {
    query: jest.fn(async (sql: string) => ({
      rows: sql.startsWith('SELECT business.id')
        ? [{ id: owner }]
        : [
            {
              ...form,
              business_id: owner,
              slug: 'contact',
              definition: form,
              revision: 1,
              updated_at: form.updatedAt,
            },
          ],
    })),
    transaction: jest.fn(
      async (work: (value: typeof client) => Promise<unknown>) => work(client),
    ),
  };
  const ingest = jest.fn().mockResolvedValue({ accepted: true });
  const pixels = { pixelIds: ['OWNER_PIXEL'], actions: {} };
  const forSource = jest.fn().mockResolvedValue(pixels);
  const service = new FormsService(
    db as unknown as DatabaseService,
    { getWorkspaceId: async () => owner } as PlatformContentWorkspaceService,
    {} as StorageService,
    { ingest } as unknown as UnifiedAnalyticsService,
    { forSource } as unknown as PublicPageAnalyticsService,
  );
  const input = {
    privacyVersion: PRIVACY_VERSION,
    requestId: randomUUID(),
    revision: 1,
    consent: true,
    answers: {},
    phoneCountryCodes: {},
    tracking: {
      visitorId: 'visitor-id',
      sessionId: 'session-id',
      pageUrl: 'https://tenant.sponsor.krd/form/contact?ttclid=ad-click',
      ttclid: 'ad-click',
      ttp: 'pixel-cookie',
    },
  };
  return { service, client, input, ingest, forSource, pixels };
}

describe('published form marketing tracking', () => {
  it.each(['tenant', ''])(
    'resolves shared owner destinations on host %s',
    async (host) => {
      const { service, forSource, pixels } = fixture(
        host ? 'business-owner' : 'platform-owner',
      );
      const payload = await service.publicForm(host, 'contact');
      expect(forSource).toHaveBeenCalledWith('form', form.id);
      expect(payload.analytics).toEqual(pixels);
    },
  );

  it('records the accepted conversion atomically with bounded match signals and no answers', async () => {
    const { service, client, input, ingest } = fixture('business-owner');
    const context = { ip: '127.0.0.1', userAgent: 'Browser' };
    await expect(
      service.submit('tenant', 'contact', input, context),
    ).resolves.toEqual({ id: 'receipt' });
    expect(ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'form_submit',
        eventId: input.requestId,
        ttclid: 'ad-click',
        ttp: 'pixel-cookie',
      }),
      context,
      client,
    );
    expect((ingest.mock.calls[0] as unknown[])[0]).not.toHaveProperty(
      'answers',
    );
    expect((ingest.mock.calls[0] as unknown[])[0]).not.toHaveProperty(
      'properties',
    );
  });

  it('returns retry receipts without sending another conversion', async () => {
    const { service, input, ingest } = fixture('business-owner', true);
    await service.submit('tenant', 'contact', input, {
      ip: '127.0.0.1',
      userAgent: 'Browser',
    });
    expect(ingest).not.toHaveBeenCalled();
  });

  it('never reports a rejected submission', async () => {
    const { service, input, ingest } = fixture('business-owner');
    await expect(
      service.submit(
        'tenant',
        'contact',
        { ...input, consent: false },
        { ip: '127.0.0.1', userAgent: 'Browser' },
      ),
    ).rejects.toThrow('Privacy consent');
    expect(ingest).not.toHaveBeenCalled();
  });
});
