import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ServiceUnavailableException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsSharingService } from './analytics-sharing.service';
import { SecretCryptoService } from '../auth/secret-crypto.service';

function fixture() {
  const id = '11111111-1111-4111-8111-111111111111';
  let row: Record<string, unknown> | null = null;
  let profile = {
    subdomain: '',
    account_type: 'platform',
    primary_hostname: null as string | null,
    business_name: 'Page owner',
    website_color: '#14b8a6',
    logo: '/images/logo.png',
    favicon: '/images/favicon.png',
  };
  const query = jest.fn(async (sql: string, values: unknown[] = []) => {
    if (sql.startsWith('SELECT business.subdomain'))
      return { rows: [{ ...profile }] };
    if (sql.startsWith('SELECT page.id'))
      return { rows: values[0] === 'owner' ? [{ id: 'public-page' }] : [] };
    if (sql.includes('pg_advisory')) return { rows: [] };
    if (sql.includes('count(*)::text total FROM analytics_share_links'))
      return { rows: [{ total: row ? '1' : '0' }] };
    if (sql.includes('gen_random_uuid()')) return { rows: [{ id }] };
    if (sql.startsWith('SELECT form.submission_count'))
      return { rows: [{ total: '1' }] };
    if (sql.includes('INSERT INTO analytics_share_links')) {
      row = {
        ...profile,
        id,
        business_id: values[1],
        public_page_id: values[2],
        code_hash: values[3],
        locale: values[4],
        expires_at: values[5],
        created_at: new Date().toISOString(),
        disabled_at: null,
        page_type: 'linktree',
        include_submissions: values[6] === true,
        source_form_id: 'source',
        name: 'Page',
        slug: 'page',
        code_reveal_ciphertext: values[7],
        can_reveal_code: true,
      };
      return { rows: [row] };
    }
    if (sql.startsWith('SELECT share.*'))
      return {
        rows:
          row &&
          !row.disabled_at &&
          (!row.expires_at ||
            (typeof row.expires_at === 'string' &&
              Date.parse(row.expires_at) > Date.now()))
            ? [row]
            : [],
      };
    if (sql.startsWith('SELECT code_reveal_ciphertext'))
      return {
        rows:
          row &&
          row.code_reveal_ciphertext &&
          !row.disabled_at &&
          (!row.expires_at ||
            (typeof row.expires_at === 'string' &&
              Date.parse(row.expires_at) > Date.now()))
            ? [{ code_reveal_ciphertext: row.code_reveal_ciphertext }]
            : [],
      };
    if (
      sql.startsWith('UPDATE analytics_share_links SET code_reveal_ciphertext')
    ) {
      if (row) {
        row.code_reveal_ciphertext = null;
        row.can_reveal_code = false;
      }
      return { rows: [] };
    }
    if (sql.startsWith('SELECT id,created_at'))
      return { rows: row ? [row] : [] };
    if (sql.startsWith('UPDATE analytics_share_links SET expires_at')) {
      if (row) row.expires_at = values[3];
      return { rows: row ? [row] : [] };
    }
    if (sql.startsWith('UPDATE analytics_share_links SET disabled_at')) {
      if (row) {
        row.disabled_at = new Date().toISOString();
        row.code_reveal_ciphertext = null;
        row.can_reveal_code = false;
      }
      return { rows: row ? [row] : [] };
    }
    if (sql.startsWith('DELETE FROM analytics_share_links')) {
      const previous = row;
      row = null;
      return { rows: previous ? [previous] : [] };
    }
    return { rows: [] };
  });
  const db = {
    query,
    transaction: (
      work: (client: { query: typeof query }) => Promise<unknown>,
    ) => work({ query }),
  };
  const sessions = new Map<string, unknown>();
  const redis = {
    isAvailable: jest.fn(() => true),
    getClient: () => ({ eval: evaluate }),
    set: jest.fn(async (key: string, value: unknown) => {
      sessions.set(key, value);
      return true;
    }),
    get: jest.fn(async (key: string) => sessions.get(key)),
  };
  const evaluate = jest.fn(async (..._args: unknown[]) => 1);
  const analytics = {
    getSummary: jest.fn(async () => ({
      total_views: 10,
      unique_views: 4,
      total_clicks: 6,
      unique_clicks: 3,
      visitorIp: 'private',
      insights: {
        contactActions: 2,
        averageActiveSeconds: 8,
        whatsapp: { private: 'secret' },
      },
    })),
    getDaily: jest.fn(async () => [
      { date: '2026-10-20', views: 3, clicks: 1, visitorId: 'private' },
    ]),
  };
  const reads = {
    getActions: jest.fn(async () => [
      {
        label: 'WhatsApp',
        totalClicks: 2,
        uniqueClickers: 1,
        destination: 'https://wa.me/9647501234567',
        metadata: { private: true },
      },
    ]),
  };
  const config = new ConfigService({
    APP_ENCRYPTION_KEY: 'test-key-not-for-production',
    APP_BASE_URL: 'https://sponsor.krd',
  });
  const forms = {
    getAnalytics: jest.fn(async () => ({
      views: 10,
      visitors: 4,
      starts: 3,
      submissions: 1,
      clicks: 6,
      completion: {
        from: '2026-10-01',
        to: '2026-10-20',
        starts: 3,
        responses: 1,
        rate: 33.3,
      },
      insights: {
        averageDurationMs: 1000,
        latestSubmissionAt: '2026-10-20T00:00:00Z',
        daily: [{ day: '2026-10-20', count: 1 }],
        sources: [],
        devices: [],
        countries: [],
        answerSummaries: [
          {
            questionId: 'name',
            label: 'Name',
            totalAnswers: 1,
            options: [{ label: 'Customer', count: 1, percentage: 100 }],
          },
        ],
        visitorIp: 'private',
      },
    })),
    submissions: jest.fn(async () => ({
      total: 1,
      items: [
        {
          id: 'response',
          createdAt: '2026-10-20T00:00:00Z',
          answers: [
            { questionId: 'phone', label: 'Phone', value: '+9647501234567' },
          ],
          consent: true,
          revision: 1,
          durationMs: 1000,
          attribution: { source: 'direct', visitorId: 'private-visitor' },
        },
      ],
    })),
  };
  const service = new AnalyticsSharingService(
    db as never,
    redis as never,
    config,
    analytics as never,
    reads as never,
    forms as never,
    new SecretCryptoService(config),
  );
  return {
    setTenant: (next: Partial<typeof profile>) => {
      profile = { ...profile, ...next };
      if (row) Object.assign(row, profile);
    },
    service,
    query,
    id,
    redis,
    evaluate,
    analytics,
    reads,
    forms,
    setKind: (kind: string) => {
      if (row) row.page_type = kind;
    },
  };
}

describe('protected analytics sharing', () => {
  function failureBudgets(evaluate: ReturnType<typeof fixture>['evaluate']) {
    const counters = new Map<string, number>();
    evaluate.mockImplementation(
      async (_script, keys, firstKey, secondKey, matches) => {
        const key = String(firstKey);
        if (keys === 1) {
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          return next;
        }
        const globalKey = String(secondKey);
        if (
          (counters.get(key) ?? 0) >= 5 ||
          (counters.get(globalKey) ?? 0) >= 50
        )
          return 0;
        if (matches === '1') return 1;
        counters.set(key, (counters.get(key) ?? 0) + 1);
        counters.set(globalKey, (counters.get(globalKey) ?? 0) + 1);
        return 0;
      },
    );
  }

  it('does not exhaust the daily guessing budget with successful viewers', async () => {
    const { service, evaluate } = fixture();
    failureBudgets(evaluate);
    const link = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    for (let n = 0; n < 60; n++)
      await expect(
        service.unlock(link.id, link.code, `viewer-${n}`),
      ).resolves.toHaveProperty('token');
  });

  it('still bounds incorrect guesses across viewers', async () => {
    const { service, evaluate } = fixture();
    failureBudgets(evaluate);
    const link = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    const wrong = link.code === '000000' ? '111111' : '000000';
    for (let n = 0; n < 50; n++)
      await expect(
        service.unlock(link.id, wrong, `attacker-${n}`),
      ).rejects.toThrow(UnauthorizedException);
    await expect(
      service.unlock(link.id, link.code, 'new-viewer'),
    ).rejects.toThrow(UnauthorizedException);
  });
  it('allows exactly one encrypted code recovery, with an owner-scoped row lock', async () => {
    const { service, query } = fixture();
    const link = await service.create('owner', 'form', 'source', {
      locale: 'en',
    });
    expect(link.canRevealCode).toBe(true);
    const stored = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO analytics_share_links'),
    )?.[1]?.[7];
    expect(Buffer.isBuffer(stored)).toBe(true);
    expect(String(stored)).not.toContain(link.code);
    await expect(
      service.revealCode('other', 'form', 'source', link.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      await service.revealCode('owner', 'form', 'source', link.id),
    ).toEqual({ code: link.code });
    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes('code_reveal_ciphertext IS NOT NULL FOR UPDATE'),
      ),
    ).toBe(true);
    await expect(
      service.revealCode('owner', 'form', 'source', link.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      (await service.list('owner', 'form', 'source'))[0].canRevealCode,
    ).toBe(false);
  });

  it('does not reveal disabled, deleted or expired codes', async () => {
    for (const action of ['disable', 'delete', 'expire']) {
      const { service } = fixture();
      const link = await service.create('owner', 'form', 'source', {
        locale: 'en',
      });
      if (action === 'expire') {
        await service.updateExpiry('owner', 'form', 'source', link.id, {
          locale: 'en',
          expiry: 'custom',
          expiresAt: new Date(Date.now() + 1000).toISOString(),
        });
        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 2000);
      } else
        await service.revoke(
          'owner',
          'form',
          'source',
          link.id,
          action === 'delete',
        );
      try {
        await expect(
          service.revealCode('owner', 'form', 'source', link.id),
        ).rejects.toBeInstanceOf(NotFoundException);
      } finally {
        jest.useRealTimers();
      }
    }
  });
  it('uses the owning business domain and isolates branding, unlock and reports by tenant', async () => {
    const { service, setTenant } = fixture();
    setTenant({
      subdomain: 'acme',
      account_type: 'business',
      business_name: 'Acme',
    });
    const link = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    expect(link.url).toContain('https://acme.sponsor.krd/analytics-share/');
    expect(await service.branding(link.id, 'ip', 'acme')).toEqual({
      name: 'Acme',
      logo: '/images/logo.png',
      favicon: '/images/favicon.png',
      accentColor: '#14b8a6',
      origin: 'https://acme.sponsor.krd',
      businessTenant: true,
    });
    await expect(
      service.branding(link.id, 'ip', 'other'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.unlock(link.id, link.code, 'ip', ''),
    ).rejects.toBeInstanceOf(NotFoundException);
    const session = await service.unlock(link.id, link.code, 'ip', 'acme');
    await expect(
      service.report(link.id, session.token, 'ip', 0, 'other'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      (await service.report(link.id, session.token, 'ip', 0, 'acme'))
        .linktreeAnalytics?.totals.total_views,
    ).toBe(10);
    setTenant({ primary_hostname: 'acme.example' });
    expect(
      (await service.list('owner', 'linktree', 'source'))[0].url,
    ).toContain('https://acme.example/analytics-share/');
    expect((await service.branding(link.id, 'ip', '')).origin).toBe(
      'https://acme.example',
    );
  });
  it('shares paginated form answers only with an explicit response grant and matches drawer data without raw tracking identities', async () => {
    const { service, forms, setKind } = fixture();
    const link = await service.create('owner', 'form', 'source', {
      locale: 'en',
      includeSubmissions: true,
    });
    setKind('form');
    const session = await service.unlock(link.id, link.code, 'ip');
    const report = await service.report(link.id, session.token, 'ip', 2);
    expect(forms.submissions).toHaveBeenCalledWith('owner', 'source', 2, {
      pageSize: 20,
    });
    expect(report.responses?.items[0].answers[0].value).toBe('+9647501234567');
    expect(report.pageType === 'form' && report.exportDefinition).toEqual({
      id: 'source',
      name: 'Page',
      slug: 'page',
    });
    expect(JSON.stringify(report.responses)).not.toContain('private-visitor');
    const result = await service.responses(link.id, session.token, 'ip', 1, {
      q: 'customer',
      pageSize: 50,
    });
    expect(result.items[0].answers[0].value).toBe('+9647501234567');
    expect(forms.submissions).toHaveBeenLastCalledWith(
      'owner',
      'source',
      1,
      { q: 'customer', pageSize: 50 },
      true,
    );
    expect(result.items[0]).toHaveProperty('durationMs', 1000);
    expect(result.items[0].attribution).toMatchObject({ source: 'direct' });
    expect(report.formAnalytics).toMatchObject({
      starts: 3,
      insights: { answerSummaries: [{ questionId: 'name' }] },
    });
    await service.revoke('owner', 'form', 'source', link.id, false);
    forms.submissions.mockClear();
    await expect(
      service.report(link.id, session.token, 'ip'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(forms.submissions).not.toHaveBeenCalled();
    await expect(
      service.responses(link.id, session.token, 'ip', 0, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('keeps existing and default form shares analytics-only', async () => {
    const { service, forms, setKind } = fixture();
    const link = await service.create('owner', 'form', 'source', {
      locale: 'en',
    });
    setKind('form');
    const session = await service.unlock(link.id, link.code, 'ip');
    const report = await service.report(link.id, session.token, 'ip');
    expect(report.responses).toBeUndefined();
    expect(report.formAnalytics?.views).toBe(10);
    expect(report.formAnalytics?.insights?.answerSummaries).toBeUndefined();
    expect(forms.submissions).not.toHaveBeenCalled();
    await expect(
      service.create('owner', 'linktree', 'source', {
        locale: 'en',
        includeSubmissions: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.report(link.id, session.token, 'ip', -1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('scopes the same range to summary and actions and preserves action ordering', async () => {
    const { service, analytics, reads } = fixture();
    const link = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    const session = await service.unlock(link.id, link.code, 'ip');
    const range = { from: '2026-10-01', to: '2026-10-20' };
    const report = await service.report(
      link.id,
      session.token,
      'ip',
      0,
      '',
      range,
    );
    expect(analytics.getSummary).toHaveBeenLastCalledWith('owner', {
      pageId: 'public-page',
      ...range,
    });
    expect(reads.getActions).toHaveBeenLastCalledWith('owner', {
      pageId: 'public-page',
      ...range,
    });
    expect(report.linktreeAnalytics?.actions[0]).toMatchObject({
      label: 'WhatsApp',
      totalClicks: 2,
      destination: 'https://wa.me/9647501234567',
    });
    await expect(
      service.report(link.id, session.token, 'ip', 0, '', {
        from: '2026-10-20',
        to: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('defaults to no expiration, stores only a keyed code hash, and excludes the code from listings', async () => {
    const { service, query } = fixture();
    const created = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    expect(created.expiresAt).toBeNull();
    expect(created.code).toMatch(/^\d{6}$/);
    const insert = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO analytics_share_links'),
    )!;
    expect(insert[1]?.[3]).toMatch(/^[a-f0-9]{64}$/);
    expect(insert[1]?.[3]).not.toBe(created.code);
    expect(await service.list('owner', 'linktree', 'source')).toEqual([
      {
        id: created.id,
        url: created.url,
        createdAt: created.createdAt,
        expiresAt: null,
        disabled: false,
        includeSubmissions: false,
        canRevealCode: true,
      },
    ]);
  });

  it.each(['disable', 'delete', 'expire'] as const)(
    'revokes an already-unlocked session on %s',
    async (operation) => {
      const { service, analytics } = fixture();
      const link = await service.create('owner', 'linktree', 'source', {
        locale: 'en',
      });
      const session = await service.unlock(link.id, link.code, 'ip');
      const report = await service.report(link.id, session.token, 'ip');
      expect(report).toMatchObject({
        linktreeAnalytics: {
          totals: { total_views: 10, unique_views: 4, total_clicks: 6 },
        },
        expiresAt: null,
      });
      expect(JSON.stringify(report)).not.toMatch(
        /private|code_hash|business_id/,
      );
      expect(analytics.getSummary).toHaveBeenCalledWith('owner', {
        pageId: 'public-page',
      });
      analytics.getSummary.mockClear();
      if (operation === 'expire') {
        jest.useFakeTimers();
        const next = new Date(Date.now() + 60_000);
        await service.updateExpiry('owner', 'linktree', 'source', link.id, {
          locale: 'en',
          expiry: 'custom',
          expiresAt: next.toISOString(),
        });
        jest.setSystemTime(new Date(next.getTime() + 1));
      } else
        await service.revoke(
          'owner',
          'linktree',
          'source',
          link.id,
          operation === 'delete',
        );
      await expect(
        service.report(link.id, session.token, 'ip'),
      ).rejects.toThrow(UnauthorizedException);
      expect(analytics.getSummary).not.toHaveBeenCalled();
      jest.useRealTimers();
    },
  );

  it('supports presets and editing a link back to no expiration', async () => {
    const { service } = fixture();
    const before = Date.now();
    const link = await service.create('owner', 'form', 'source', {
      locale: 'ckb',
      expiry: 'hour',
    });
    expect(Date.parse(link.expiresAt!) - before).toBeGreaterThanOrEqual(
      3600_000,
    );
    expect(
      (
        await service.updateExpiry('owner', 'form', 'source', link.id, {
          locale: 'ckb',
          expiry: 'never',
        })
      ).expiresAt,
    ).toBeNull();
    await expect(
      service.create('owner', 'form', 'source', {
        locale: 'en',
        expiry: 'custom',
        expiresAt: '2020-01-01T00:00:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects cross-owner operations, wrong codes, mismatched share sessions and Redis failures', async () => {
    const { service, redis, evaluate } = fixture();
    await expect(service.list('other', 'form', 'source')).rejects.toThrow(
      NotFoundException,
    );
    const link = await service.create('owner', 'linktree', 'source', {
      locale: 'en',
    });
    await expect(
      service.revoke('other', 'linktree', 'source', link.id, true),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.unlock(
        link.id,
        link.code === '000000' ? '111111' : '000000',
        'ip',
      ),
    ).rejects.toThrow(UnauthorizedException);
    const session = await service.unlock(link.id, link.code, 'ip');
    await expect(
      service.report('another-share', session.token, 'ip'),
    ).rejects.toThrow(UnauthorizedException);
    evaluate.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(service.unlock(link.id, link.code, 'ip')).rejects.toThrow(
      UnauthorizedException,
    );
    redis.isAvailable.mockReturnValue(false);
    await expect(service.unlock(link.id, link.code, 'ip')).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.report(link.id, session.token, 'ip')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
