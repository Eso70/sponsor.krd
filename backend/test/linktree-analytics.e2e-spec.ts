import { PublicPageAnalyticsService } from '../src/analytics/public-page-analytics.service';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { Pool, type PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { readBaselineSql } from '../src/database/baseline';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/redis/redis.service';
import { UnifiedAnalyticsService } from '../src/analytics/unified-analytics.service';
import { AnalyticsReadService } from '../src/analytics/analytics-read.service';
import { PublicUnifiedAnalyticsController } from '../src/analytics/unified-analytics.controller';
import { publicImageDimensions } from '../src/storage/public-image-dimensions';
import { syncWhatsAppQuestions } from '../src/linktrees/sync-whatsapp-questions';
import { AuthService } from '../src/auth/auth.service';
import { PublicService } from '../src/public/public.service';
import { PlatformContentWorkspaceService } from '../src/platform-workspace/platform-content-workspace.service';

const databaseName = `sponsor_krd_linktree_analytics_e2e_${process.pid}`;
const connection = (database: string) => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database,
  connectionTimeoutMillis: 5000,
});

describe('Linktree question analytics and delivery reconciliation (PostgreSQL)', () => {
  jest.setTimeout(60000);
  let maintenance: Pool;
  let pool: Pool;
  let analytics: UnifiedAnalyticsService;
  let reads: AnalyticsReadService;
  let controller: PublicUnifiedAnalyticsController;
  let owners: string[];
  const context = { ip: '203.0.113.9', userAgent: 'Mozilla/5.0 Chrome/130.0' };

  beforeAll(async () => {
    if (!/^sponsor_krd_linktree_analytics_e2e_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool(
      connection(process.env.DB_MAINTENANCE_NAME || 'postgres'),
    );
    await maintenance.query(
      `CREATE DATABASE "${databaseName}" WITH TEMPLATE template0 ENCODING 'UTF8'`,
    );
    pool = new Pool(connection(databaseName));
    await pool.query(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    const database = {
      query: pool.query.bind(pool),
      transaction: async <T>(callback: (client: PoolClient) => Promise<T>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await callback(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    } as unknown as DatabaseService;
    analytics = new UnifiedAnalyticsService(
      database,
      new ConfigService({ ANALYTICS_HASH_SECRET: 's'.repeat(32) }),
    );
    reads = new AnalyticsReadService(database);
    controller = new PublicUnifiedAnalyticsController(analytics, {
      isRateLimited: async () => false,
    } as unknown as RedisService);
    const business = await pool.query<{ id: string }>(
      "INSERT INTO businesses(username,name,subdomain) VALUES('analytics-fixture','Analytics fixture','analytics-fixture') RETURNING id",
    );
    const platform = await pool.query<{ id: string }>(
      "SELECT id FROM businesses WHERE account_type='platform'",
    );
    owners = [business.rows[0].id, platform.rows[0].id];
  });

  afterAll(async () => {
    await pool?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });

  it('lists only public owner-scoped pages, with bounded pagination and no private form data', async () => {
    const database = {
      query: pool.query.bind(pool),
    } as unknown as DatabaseService;
    const service = new PublicService(
      database,
      {} as never,
      {} as never,
      new PlatformContentWorkspaceService(database),
    );
    const own = await pageFor(owners[0]);
    const other = await pageFor(owners[1]);
    expect(
      (
        await service.getPublicDirectory('analytics-fixture', 'linktree', 1)
      ).items.map((item) => item.slug),
    ).toContain(own.slug);
    expect(
      (
        await service.getPublicDirectory('analytics-fixture', 'linktree', 1)
      ).items.map((item) => item.slug),
    ).not.toContain(other.slug);
    expect(
      (await service.getPublicDirectory('', 'linktree', 1)).items.map(
        (item) => item.slug,
      ),
    ).toContain(other.slug);
    expect(
      (await service.getPublicDirectory('', 'linktree', 1)).items.map(
        (item) => item.slug,
      ),
    ).not.toContain(own.slug);
    await pool.query('UPDATE linktrees SET is_archived=true WHERE id=$1', [
      own.treeId,
    ]);
    expect(
      (
        await service.getPublicDirectory('analytics-fixture', 'linktree', 1)
      ).items.map((item) => item.slug),
    ).toContain(own.slug);
    expect(
      (await service.getLinktreesBySubdomain('analytics-fixture')).map(
        (item) => item.uid,
      ),
    ).toContain(own.slug);
    await pool.query(
      "UPDATE linktrees SET is_archived=false,status='inactive' WHERE id=$1",
      [own.treeId],
    );
    expect(
      (
        await service.getPublicDirectory('analytics-fixture', 'linktree', 1)
      ).items.map((item) => item.slug),
    ).not.toContain(own.slug);
    await pool.query(
      `UPDATE business_subscriptions s SET subscription_plan_id=p.id,plan_configuration_id=c.id
      FROM billing_subscription_plans p JOIN billing_plan_configurations c ON c.plan_id=p.permission_profile_id
      WHERE s.business_id=$1 AND p.code='max'`,
      [owners[0]],
    );
    for (const [index, owner] of owners.entries()) {
      await pool.query(
        `INSERT INTO forms(business_id,name,slug,definition) VALUES($1,'PRIVATE INTERNAL NAME',$2,$3::jsonb)`,
        [
          owner,
          `directory-form-${index}`,
          JSON.stringify({
            headline: `Public form ${index}`,
            logo: '/images/upload/form-logo.png',
            bannerMode: 'carousel',
            bannerImages: [
              '/images/upload/form-banner.png',
              '/images/upload/second-banner.png',
            ],
            description: 'Public description',
            language: 'ckb',
            questions: [{ label: 'PRIVATE QUESTION', required: true }],
          }),
        ],
      );
    }
    const forms = await service.getPublicDirectory(
      'analytics-fixture',
      'form',
      1,
    );
    expect(forms.items).toEqual([
      {
        slug: 'directory-form-0',
        title: 'Public form 0',
        description: 'Public description',
        contentCount: 1,
        isDefault: false,
        language: 'ckb',
        requiredQuestionCount: 1,
        logo: '/images/upload/form-logo.png',
        bannerMode: 'carousel',
        bannerImages: [
          '/images/upload/form-banner.png',
          '/images/upload/second-banner.png',
        ],
      },
    ]);
    expect(JSON.stringify(forms)).not.toMatch(
      /PRIVATE|submission|questions|pixel/,
    );
    await pool.query(
      `UPDATE forms SET definition=definition || '{"logoEnabled":false,"bannerEnabled":false}'::jsonb WHERE slug='directory-form-0'`,
    );
    expect(
      (await service.getPublicDirectory('analytics-fixture', 'form', 1))
        .items[0],
    ).toMatchObject({ logo: null, bannerImages: [] });
    expect(
      (await service.getPublicDirectory('', 'form', 1)).items.map(
        (item) => item.slug,
      ),
    ).toContain('directory-form-1');
    expect(
      (await service.getPublicDirectory('', 'form', 1)).items.map(
        (item) => item.slug,
      ),
    ).not.toContain('directory-form-0');
    await pool.query(
      "UPDATE forms SET is_archived=true WHERE slug='directory-form-0'",
    );
    expect(
      (
        await service.getPublicDirectory('analytics-fixture', 'form', 1)
      ).items.map((item) => item.slug),
    ).toContain('directory-form-0');
    await pool.query(
      "UPDATE forms SET is_archived=false,status='paused' WHERE slug='directory-form-0'",
    );
    expect(
      (await service.getPublicDirectory('analytics-fixture', 'form', 1)).items,
    ).toEqual([]);
    await pool.query(
      "UPDATE forms SET status='active' WHERE slug='directory-form-0'",
    );
    await pool.query(
      "UPDATE business_subscriptions SET subscription_plan_id=(SELECT id FROM billing_subscription_plans WHERE code='basic') WHERE business_id=$1",
      [owners[0]],
    );
    expect(
      (await service.getPublicDirectory('analytics-fixture', 'form', 1)).items,
    ).toEqual([]);
    await pool.query(
      `INSERT INTO linktrees(business_id,headline,seo_name,uid) SELECT $1,'Directory '||n,'directory-'||n,'directory-'||n FROM generate_series(1,26) n`,
      [owners[0]],
    );
    const first = await service.getPublicDirectory(
      'analytics-fixture',
      'linktree',
      1,
    );
    const second = await service.getPublicDirectory(
      'analytics-fixture',
      'linktree',
      2,
    );
    expect(first.items).toHaveLength(24);
    expect(second.items.length).toBeGreaterThan(0);
    expect(
      new Set([...first.items, ...second.items].map((item) => item.slug)).size,
    ).toBe(first.total);
    await expect(
      service.getPublicDirectory('analytics-fixture', 'linktree', 10000),
    ).rejects.toThrow('Page not found');
    await expect(
      service.getPublicDirectory('missing-owner', 'form', 1),
    ).rejects.toThrow();
    await pool.query("UPDATE businesses SET status='suspended' WHERE id=$1", [
      owners[0],
    ]);
    await expect(
      service.getPublicDirectory('analytics-fixture', 'linktree', 1),
    ).rejects.toThrow();
    await pool.query("UPDATE businesses SET status='active' WHERE id=$1", [
      owners[0],
    ]);
  });

  it('persists the homepage switch independently per business and selects only its active default', async () => {
    const database = {
      query: pool.query.bind(pool),
    } as unknown as DatabaseService;
    const auth = new AuthService(database, {} as RedisService);
    const publicService = new PublicService(
      database,
      {} as never,
      {} as never,
      {} as never,
    );
    const subdomain = 'analytics-fixture';
    const ownPage = await pageFor(owners[0]);
    const foreignPage = await pageFor(owners[1]);
    await pool.query(
      'UPDATE linktrees SET is_default=true WHERE id=ANY($1::uuid[])',
      [[ownPage.treeId, foreignPage.treeId]],
    );
    const original = await publicService.getBusinessBySubdomain(subdomain);
    expect(original.homepage_linktree).toBe(false);
    expect(original.default_linktree_slug).toBe(ownPage.slug);
    await auth.updateBusinessSettings(owners[0], {
      section: 'defaults',
      homepage_linktree: true,
    });
    expect(await auth.getBusinessSettings(owners[0])).toMatchObject({
      homepage_linktree: true,
    });
    expect(await auth.getBusinessSettings(owners[1])).toMatchObject({
      homepage_linktree: false,
    });
    // Other defaults saves must not turn the homepage off.
    await auth.updateBusinessSettings(owners[0], {
      section: 'defaults',
      default_background_color: '#abcdef',
    });
    expect(await publicService.getBusinessBySubdomain(subdomain)).toMatchObject(
      { homepage_linktree: true, default_linktree_slug: ownPage.slug },
    );
    await pool.query("UPDATE linktrees SET status='inactive' WHERE id=$1", [
      ownPage.treeId,
    ]);
    expect(
      (await publicService.getBusinessBySubdomain(subdomain))
        .default_linktree_slug,
    ).toBeNull();
    await pool.query(
      "UPDATE linktrees SET status='active',is_archived=true WHERE id=$1",
      [ownPage.treeId],
    );
    expect(
      (await publicService.getBusinessBySubdomain(subdomain))
        .default_linktree_slug,
    ).toBe(ownPage.slug);
    await auth.updateBusinessSettings(owners[0], {
      section: 'defaults',
      homepage_linktree: false,
    });
    expect(await auth.getBusinessSettings(owners[0])).toMatchObject({
      homepage_linktree: false,
    });
    await pool.query(
      'UPDATE linktrees SET is_default=false WHERE id=ANY($1::uuid[])',
      [[ownPage.treeId, foreignPage.treeId]],
    );
  });

  it('returns stored banner dimensions only for the page owner in both workspaces', async () => {
    const urls = owners.map(() => `/images/upload/${randomUUID()}.png`);
    for (const [index, owner] of owners.entries()) {
      await pool.query(
        `INSERT INTO uploaded_media_assets(storage_key, public_url, scope, owner_business_id, format, original_byte_size, stored_byte_size, width, height)
         VALUES($1,$2,'business',$3,'png',100,100,1200,600)`,
        [urls[index].slice('/images/upload/'.length), urls[index], owner],
      );
    }
    const database = {
      query: pool.query.bind(pool),
    } as unknown as DatabaseService;
    for (const [index, owner] of owners.entries()) {
      const page = await pageFor(owner);
      const dimensions = await publicImageDimensions(
        database,
        'linktree',
        page.treeId,
        urls,
      );
      expect(dimensions).toEqual({
        [urls[index]]: { width: 1200, height: 600 },
      });
      const form = await pool.query<{ id: string }>(
        `INSERT INTO forms(business_id,name,slug,definition) VALUES($1,'Media fixture',$2,'{}'::jsonb) RETURNING id`,
        [owner, `media-${randomUUID()}`],
      );
      expect(
        await publicImageDimensions(database, 'form', form.rows[0].id, urls),
      ).toEqual(dimensions);
    }
  });

  async function pageFor(owner: string) {
    const slug = `analytics-${randomUUID()}`;
    const tree = await pool.query<{ id: string }>(
      `INSERT INTO linktrees(business_id,headline,seo_name,uid,template_config,whatsapp_modal_enabled) VALUES($1,'Question fixture',$2,$2,$3::jsonb,true) RETURNING id`,
      [
        owner,
        slug,
        JSON.stringify({
          whatsapp_modal: {
            enabled: true,
            questions: [
              {
                id: 'price',
                text: 'Price enquiry',
                message: 'Private message',
              },
              { id: 'order', text: 'Order', message: 'Private message' },
            ],
          },
        }),
      ],
    );
    const treeId = tree.rows[0].id;
    // PublicService renders these database IDs, never the stale editor IDs
    // in template_config. Reproduce the actual create/update persistence path.
    const questions = await pool.query<{ id: string; question_text: string }>(
      `INSERT INTO whatsapp_questions(linktree_id,question_text,message,display_order)
       VALUES($1,'Price enquiry','Private message',0),($1,'Order','Private message',1)
       RETURNING id,question_text`,
      [treeId],
    );
    const link = await pool.query<{ id: string }>(
      "INSERT INTO links(business_id,linktree_id,platform,url) VALUES($1,$2,'whatsapp','https://wa.me/9647500000000') RETURNING id",
      [owner, treeId],
    );
    const page = await pool.query<{ id: string; action_id: string }>(
      'SELECT page.id, action.id AS action_id FROM public_pages page JOIN public_page_actions action ON action.public_page_id=page.id WHERE page.source_linktree_id=$1 AND action.source_link_id=$2',
      [treeId, link.rows[0].id],
    );
    return {
      treeId,
      slug,
      pageId: page.rows[0].id,
      actionId: page.rows[0].action_id,
      linkId: link.rows[0].id,
      priceQuestionId: questions.rows.find(
        (q) => q.question_text === 'Price enquiry',
      )!.id,
      orderQuestionId: questions.rows.find((q) => q.question_text === 'Order')!
        .id,
    };
  }

  it.each([0, 1])(
    'keeps archived active pages public in owner context %s',
    async (ownerIndex) => {
      const page = await pageFor(owners[ownerIndex]);
      await pool.query('UPDATE linktrees SET is_archived=true WHERE id=$1', [
        page.treeId,
      ]);
      const database = {
        query: pool.query.bind(pool),
      } as unknown as DatabaseService;
      const cache = new Map<string, unknown>();
      const service = new PublicService(
        database,
        {
          get: async (key: string) => cache.get(key),
          set: async (key: string, value: unknown) => {
            cache.set(key, value);
            return true;
          },
        } as unknown as RedisService,
        { forSource: async () => ({}) } as never,
        new PlatformContentWorkspaceService(database),
      );
      const subdomain = ownerIndex === 0 ? 'analytics-fixture' : '';
      expect(
        await service.assertPublicLinktreeAvailable(page.slug, subdomain),
      ).toBe(page.slug);
      const read = () =>
        ownerIndex === 0
          ? service.getPublicLinktreeByUidAndSubdomain(page.slug, subdomain)
          : service.getPlatformPublicLinktree(page.slug);
      expect((await read()).linktree.id).toBe(page.treeId);
      expect((await read()).linktree.id).toBe(page.treeId);
      await expect(
        service.assertPublicLinktreeAvailable(page.slug, 'another-tenant'),
      ).rejects.toMatchObject({ status: 404 });
      await pool.query("UPDATE linktrees SET status='inactive' WHERE id=$1", [
        page.treeId,
      ]);
      await expect(
        service.assertPublicLinktreeAvailable(page.slug, subdomain),
      ).rejects.toMatchObject({ status: 404 });
    },
  );

  it.each([0, 1])(
    'records the redirect-first question exactly once for owner context %s',
    async (ownerIndex) => {
      const owner = owners[ownerIndex];
      const page = await pageFor(owner);
      const eventId = randomUUID();
      const identity = {
        visitorId: 'question-visitor',
        sessionId: 'question-session',
        occurredAt: new Date().toISOString(),
      };
      await analytics.ingest(
        {
          ...identity,
          pageId: page.treeId,
          eventId: randomUUID(),
          eventName: 'action_open',
          properties: {
            measurement: 'whatsapp_questions',
            step: 'opened',
            linkId: page.linkId,
          },
        },
        context,
      );
      const redirect = jest.fn();
      await controller.open(
        page.treeId,
        page.actionId,
        {
          ...identity,
          eventId,
          eventName: 'whatsapp_click',
          whatsappQuestionId: page.priceQuestionId,
          message: 'Private message',
          browserDispatched: 'true',
          browserEventName: 'Contact',
        },
        {
          headers: { 'user-agent': context.userAgent },
          ip: context.ip,
        } as unknown as FastifyRequest,
        { header: jest.fn(), redirect } as unknown as FastifyReply,
      );
      const retry = await analytics.ingest(
        {
          ...identity,
          pageId: page.treeId,
          actionId: page.actionId,
          eventId,
          eventName: 'whatsapp_click',
          properties: { whatsappQuestionId: page.priceQuestionId },
        },
        context,
      );
      expect(retry.deduplicated).toBe(true);
      expect(redirect).toHaveBeenCalledWith(
        'https://wa.me/9647500000000?text=Private+message',
        302,
      );
      const summary = await analytics.getSummary(owner, {
        pageId: page.treeId,
      });
      expect(summary.total_clicks).toBe(1);
      expect(summary.conversions).toBe(1);
      expect(summary.insights?.whatsapp).toMatchObject({
        opened: 1,
        dismissed: 0,
        selected: 1,
      });
      expect(summary.insights?.whatsapp?.questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Price enquiry',
            clicks: 1,
            uniqueVisitors: 1,
          }),
          expect.objectContaining({ label: 'Order', clicks: 0 }),
        ]),
      );
      const actions = await reads.getActions(owner, { pageId: page.treeId });
      expect(
        actions.find((action) => action.id === page.actionId),
      ).toMatchObject({ totalClicks: 1, conversions: 1 });
      const health = await reads.getTikTokHealth(owner, {
        pageId: page.treeId,
      });
      expect(health.browserEvents).toBe(1); // A browser Pixel needs no Events API token.
      expect(health.serverEvents).toBe(0);
      // Read correction for retained events written before contact rollups.
      await pool.query(
        'UPDATE analytics_page_daily SET conversions=0 WHERE public_page_id=$1',
        [page.pageId],
      );
      await pool.query(
        'UPDATE analytics_events SET is_conversion=false WHERE public_page_id=$1',
        [page.pageId],
      );
      expect(
        (await analytics.getSummary(owner, { pageId: page.treeId }))
          .conversions,
      ).toBe(1);
      const otherOwner = owners[1 - ownerIndex];
      expect(
        (await analytics.getSummary(otherOwner, { pageId: page.treeId }))
          .insights?.whatsapp?.selected,
      ).toBe(0);
      expect(
        (await reads.getTikTokHealth(otherOwner, { pageId: page.treeId }))
          .browserEvents,
      ).toBe(0);
    },
  );

  it('filters delivery by the event calendar day and counts browser events once across destinations', async () => {
    const owner = owners[1];
    const page = await pageFor(owner);
    await pool.query('UPDATE public_pages SET timezone=$1 WHERE id=$2', [
      'Asia/Baghdad',
      page.pageId,
    ]);
    await pool.query(
      "INSERT INTO business_tiktok_pixels(business_id,pixel_id,encrypted_events_token) VALUES($1,'fixture-pixel-one',$2),($1,'fixture-pixel-two',$2)",
      [owner, Buffer.from('fixture-no-delivery')],
    );
    // 00:30 in Baghdad; a UTC date filter used to exclude this real click.
    const localDay = new Date().toISOString().slice(0, 10);
    const at = new Date(`${localDay}T00:30:00+03:00`).toISOString();
    await analytics.ingest(
      {
        pageId: page.treeId,
        actionId: page.actionId,
        eventId: randomUUID(),
        eventName: 'whatsapp_click',
        visitorId: 'date-visitor',
        sessionId: 'date-session',
        occurredAt: at,
        browserDispatched: true,
        browserEventName: 'Contact',
      },
      context,
    );
    await pool.query(
      "UPDATE marketing_event_outbox SET status='delivered', delivered_at=now(), created_at=now()+interval '2 days' WHERE analytics_event_id IN (SELECT id FROM analytics_events WHERE public_page_id=$1)",
      [page.pageId],
    );
    const health = await reads.getTikTokHealth(owner, {
      pageId: page.treeId,
      from: localDay,
      to: localDay,
    });
    expect(health).toMatchObject({
      browserEvents: 1,
      serverEvents: 2,
      delivered: 2,
      reconciliation: { internalConversions: 1, serverAcceptedConversions: 1 },
    });
    expect(
      (
        await analytics.getSummary(owner, {
          pageId: page.treeId,
          from: localDay,
          to: localDay,
        })
      ).conversions,
    ).toBe(1);
  });

  it.each([0, 1])(
    'preserves question history across edits and removal for owner context %s',
    async (ownerIndex) => {
      const owner = owners[ownerIndex];
      const page = await pageFor(owner);
      const otherPage = await pageFor(owners[1 - ownerIndex]);
      // Default/legacy pages can have table-backed questions and no JSON copy.
      await pool.query(
        "UPDATE linktrees SET template_config='{}'::jsonb WHERE id=$1",
        [page.treeId],
      );
      const click = (questionId: string) =>
        analytics.ingest(
          {
            pageId: page.treeId,
            actionId: page.actionId,
            eventId: randomUUID(),
            eventName: 'whatsapp_click',
            visitorId: 'edit-visitor',
            sessionId: 'edit-session',
            occurredAt: new Date().toISOString(),
            properties: { whatsappQuestionId: questionId },
          },
          context,
        );
      await click(page.orderQuestionId);
      await click(otherPage.orderQuestionId);
      await click('order'); // Stale editor ID must not be accepted.
      let summary = await analytics.getSummary(owner, { pageId: page.treeId });
      expect(summary.insights?.whatsapp?.selected).toBe(1);
      expect(summary.insights?.whatsapp?.questions).toHaveLength(2);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM linktrees WHERE id=$1 FOR UPDATE', [
          page.treeId,
        ]);
        await syncWhatsAppQuestions(client, page.treeId, [
          {
            id: page.orderQuestionId,
            text: 'داواکردن',
            message: 'Edited message',
          },
          {
            id: page.priceQuestionId,
            text: 'Price enquiry',
            message: 'Private message',
          },
          {
            id: otherPage.orderQuestionId,
            text: 'New question',
            message: 'Private message',
          },
        ]);
        await client.query('COMMIT');
        const saved = await pool.query<{ id: string; question_text: string }>(
          'SELECT id,question_text FROM whatsapp_questions WHERE linktree_id=$1 ORDER BY display_order',
          [page.treeId],
        );
        expect(saved.rows[0]).toEqual({
          id: page.orderQuestionId,
          question_text: 'داواکردن',
        });
        expect(saved.rows[2].id).not.toBe(otherPage.orderQuestionId);
        await click(page.orderQuestionId);
        summary = await analytics.getSummary(owner, { pageId: page.treeId });
        expect(summary.insights?.whatsapp).toMatchObject({ selected: 2 });
        expect(summary.insights?.whatsapp?.questions).toContainEqual(
          expect.objectContaining({
            label: 'داواکردن',
            clicks: 2,
            uniqueVisitors: 1,
            historical: false,
          }),
        );
        await client.query('BEGIN');
        await client.query('SELECT id FROM linktrees WHERE id=$1 FOR UPDATE', [
          page.treeId,
        ]);
        await syncWhatsAppQuestions(client, page.treeId, []);
        await client.query('COMMIT');
        summary = await analytics.getSummary(owner, { pageId: page.treeId });
        expect(summary.insights?.whatsapp?.questions).toEqual([
          expect.objectContaining({
            label: 'داواکردن',
            clicks: 2,
            historical: true,
          }),
        ]);
        expect(
          (
            await pool.query(
              'SELECT id FROM whatsapp_questions WHERE linktree_id=$1',
              [otherPage.treeId],
            )
          ).rows,
        ).toHaveLength(2);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    },
  );

  it('uses the public modal enabled flag rather than stale JSON settings', async () => {
    const page = await pageFor(owners[0]);
    await pool.query(
      'UPDATE linktrees SET whatsapp_modal_enabled=false WHERE id=$1',
      [page.treeId],
    );
    await analytics.ingest(
      {
        pageId: page.treeId,
        actionId: page.actionId,
        eventId: randomUUID(),
        eventName: 'whatsapp_click',
        visitorId: 'disabled-visitor',
        sessionId: 'disabled-session',
        occurredAt: new Date().toISOString(),
        properties: { whatsappQuestionId: page.orderQuestionId },
      },
      context,
    );
    expect(
      (await analytics.getSummary(owners[0], { pageId: page.treeId })).insights
        ?.whatsapp,
    ).toMatchObject({ selected: 0, questions: [] });
  });
  it.each([0, 1])(
    'matches browser metadata and Events API data for Linktree owner context %s',
    async (ownerIndex) => {
      const owner = owners[ownerIndex];
      const page = await pageFor(owner);
      await pool.query(
        'INSERT INTO business_tiktok_pixels(business_id,pixel_id,encrypted_events_token) VALUES($1,$2,$3)',
        [
          owner,
          `MATCH_${randomUUID().replace(/-/g, '')}`,
          Buffer.from('fixture'),
        ],
      );
      const meta = await new PublicPageAnalyticsService({
        query: pool.query.bind(pool),
      } as unknown as DatabaseService).forSource('linktree', page.treeId);
      expect(meta.content!.id).toBe(page.pageId);
      expect(meta.actions[`link:${page.linkId}`]).toMatchObject({
        id: page.actionId,
        pixelEvent: 'Contact',
        contentName: 'WhatsApp',
      });
      const url = `https://${ownerIndex === 0 ? 'analytics-fixture.' : ''}sponsor.krd/linktree/${page.slug}`;
      for (const kind of ['view', 'contact'] as const) {
        const eventId = randomUUID();
        await analytics.ingest(
          {
            eventId,
            pageId: page.treeId,
            actionId: kind === 'contact' ? page.actionId : undefined,
            eventName: kind === 'contact' ? 'whatsapp_click' : 'page_view',
            visitorId: 'parity-visitor',
            sessionId: 'parity-session',
            occurredAt: new Date().toISOString(),
            pageUrl: url,
            browserDispatched: true,
            browserEventName: kind === 'contact' ? 'Contact' : 'ViewContent',
            properties: { platform: 'untrusted-override' },
          },
          context,
        );
        const jobs = await pool.query<{ payload: Record<string, unknown> }>(
          'SELECT payload FROM marketing_event_outbox WHERE external_event_id=$1',
          [eventId],
        );
        expect(jobs.rows.length).toBeGreaterThan(0);
        for (const job of jobs.rows)
          expect(job.payload).toMatchObject({
            event: kind === 'contact' ? 'Contact' : 'ViewContent',
            event_id: eventId,
            url,
            content_id: kind === 'contact' ? page.actionId : meta.content!.id,
            content_name: kind === 'contact' ? 'WhatsApp' : meta.content!.name,
          });
      }
    },
  );
});
