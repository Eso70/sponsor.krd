import { PublicService } from './public.service';
import type { DatabaseService } from '../database/database.service';
import type { RedisService } from '../redis/redis.service';
import type { PublicPageAnalyticsService } from '../analytics/public-page-analytics.service';
import type { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';

describe('tenant sitemap and cached publication boundaries', () => {
  function setup() {
    const query = jest.fn();
    const get = jest.fn().mockResolvedValue(null);
    const service = new PublicService(
      { query } as unknown as DatabaseService,
      { get } as unknown as RedisService,
      {} as PublicPageAnalyticsService,
      {
        getWorkspaceId: jest.fn().mockResolvedValue('platform-owner'),
      } as unknown as PlatformContentWorkspaceService,
    );
    return { service, query, get };
  }
  it.each(['tenant-a', 'tenant-b'])(
    'scopes identical public slugs to %s and paginates',
    async (tenant) => {
      const { service, query } = setup();
      query
        .mockResolvedValueOnce({ rows: [{ id: `${tenant}-owner` }] })
        .mockResolvedValueOnce({
          rows: [{ slug: 'same-slug', updatedAt: '2026-10-02', total: '1001' }],
        });
      expect(await service.getSitemapPages(tenant, 0)).toMatchObject({
        totalPages: 2,
        pages: [{ slug: 'same-slug' }],
      });
      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("status = 'active'"),
        [tenant],
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('lt.business_id = $1::uuid'),
        [`${tenant}-owner`, 0],
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('lt.description'),
        expect.any(Array),
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('lt.is_archived'),
        expect.any(Array),
      );
    },
  );
  it('includes owned active forms using the same pagination and content policy', async () => {
    const { service, query } = setup();
    query.mockResolvedValueOnce({
      rows: [
        {
          slug: 'consultation',
          pageType: 'form',
          updatedAt: '2026-10-11',
          total: '1',
        },
      ],
    });
    expect(await service.getSitemapPages('', 0)).toMatchObject({
      pages: [{ slug: 'consultation', pageType: 'form' }],
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('f.business_id = $1::uuid'),
      ['platform-owner', 0],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("f.status = 'active'"),
      expect.any(Array),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("f.definition->>'description'"),
      expect.any(Array),
    );
    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining('form_submissions'),
      expect.any(Array),
    );
  });
  it('rejects an unknown or disabled tenant before reading pages', async () => {
    const { service, query } = setup();
    query.mockResolvedValue({ rows: [] });
    await expect(service.getSitemapPages('missing', 0)).rejects.toMatchObject({
      status: 404,
    });
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('does not serve cached content after publication or ownership changes', async () => {
    const { service, query, get } = setup();
    get.mockResolvedValue({ linktree: { id: 'cached-page' }, links: [] });
    query.mockResolvedValue({ rows: [] });
    await expect(
      service.getPublicLinktreeByUidAndSubdomain('same-slug', 'tenant-a'),
    ).rejects.toMatchObject({ status: 404 });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("lt.status = 'active'"),
      ['cached-page', 'tenant-a', 'same-slug'],
    );
  });
  it('returns a canonical slug only for a live, owner-scoped availability gate', async () => {
    const { service, query } = setup();
    query.mockResolvedValue({
      rows: [
        {
          status: 'active',
          owner_status: 'active',
          is_archived: false,
          canonical_slug: 'same-slug',
        },
      ],
    });
    expect(
      await service.assertPublicLinktreeAvailable('random-id', 'tenant-a'),
    ).toBe('same-slug');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('a.subdomain = $2'),
      ['random-id', 'tenant-a'],
    );
    query.mockResolvedValue({
      rows: [
        { status: 'active', owner_status: 'disabled', is_archived: false },
      ],
    });
    await expect(
      service.assertPublicLinktreeAvailable('random-id', 'tenant-a'),
    ).rejects.toMatchObject({ status: 404 });
  });
});
