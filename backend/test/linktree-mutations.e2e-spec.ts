import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, type PoolClient } from 'pg';
import { readBaselineSql } from '../src/database/baseline';
import { DatabaseService } from '../src/database/database.service';
import { StorageService } from '../src/storage/storage.service';
import { updateLinktreeInTransaction } from '../src/linktrees/linktree-write';
import { syncLinksInTransaction } from '../src/links/sync-links';
import type { UpdateLinktreeDto } from '../src/linktrees/dto/update-linktree.dto';

const databaseName = `sponsor_krd_linktree_mutations_e2e_${process.pid}`;
const connection = (database: string) => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database,
  connectionTimeoutMillis: 5000,
});

describe('Shared Linktree mutation transactions (PostgreSQL)', () => {
  jest.setTimeout(60000);
  let maintenance: Pool;
  let pool: Pool;
  let storage: StorageService;
  let owners: string[];
  let pageId: string;
  let linkId: string;
  let actionId: string;

  async function transaction<T>(operation: (client: PoolClient) => Promise<T>) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const update = (
    changes: UpdateLinktreeDto,
    scope: 'business' | 'platform' = 'business',
  ) =>
    transaction((client) =>
      updateLinktreeInTransaction(
        client,
        pageId,
        changes,
        owners[0],
        scope,
        storage,
        async () => undefined,
      ),
    );

  beforeAll(async () => {
    if (!/^sponsor_krd_linktree_mutations_e2e_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    maintenance = new Pool(
      connection(process.env.DB_MAINTENANCE_NAME || 'postgres'),
    );
    await maintenance.query(
      `CREATE DATABASE "${databaseName}" WITH TEMPLATE template0 ENCODING 'UTF8'`,
    );
    pool = new Pool(connection(databaseName));
    await pool.query<Record<string, unknown>>(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    const database = {
      query: pool.query.bind(pool),
    } as unknown as DatabaseService;
    storage = new StorageService({} as never, database);
    owners = (
      await pool.query<{ id: string }>(
        "INSERT INTO businesses(username,name,subdomain) VALUES('mutation-one','One','mutation-one'),('mutation-two','Two','mutation-two') RETURNING id",
      )
    ).rows.map((row) => row.id);
    await pool.query<Record<string, unknown>>(
      `CREATE FUNCTION reject_mutation_fixture_link() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.url='https://example.com/reject' THEN RAISE EXCEPTION 'fixture link rejected'; END IF; RETURN NEW; END $$`,
    );
    await pool.query<Record<string, unknown>>(
      'CREATE TRIGGER reject_mutation_fixture_link BEFORE INSERT OR UPDATE ON links FOR EACH ROW EXECUTE FUNCTION reject_mutation_fixture_link()',
    );
  });

  afterAll(async () => {
    await pool?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });

  beforeEach(async () => {
    const slug = `mutation-${randomUUID()}`;
    pageId = (
      await pool.query<{ id: string }>(
        "INSERT INTO linktrees(business_id,headline,description,seo_name,uid,template_key,template_config) VALUES($1,'Original','Old description',$2,$2,'spectrum','{\"templateKey\":\"spectrum\"}') RETURNING id",
        [owners[0], slug],
      )
    ).rows[0].id;
    linkId = (
      await pool.query<{ id: string }>(
        "INSERT INTO links(linktree_id,business_id,platform,url,display_order) VALUES($1,$2,'website','https://example.com',0) RETURNING id",
        [pageId, owners[0]],
      )
    ).rows[0].id;
    actionId = (
      await pool.query<{ id: string }>(
        'SELECT id FROM public_page_actions WHERE source_link_id=$1',
        [linkId],
      )
    ).rows[0].id;
  });

  it.each(['business', 'platform'] as const)(
    'clears descriptions and retains link/action identity and metadata for %s saves',
    async (scope) => {
      await update(
        {
          description: '',
          links: { website: ['https://example.com'] },
          linkMetadata: {
            website: [
              {
                display_name: 'Edited',
                metadata: {
                  original_input: 'example.com',
                  country_code: 'IQ',
                  gps_lat: 36,
                  gps_lng: 44,
                  custom_color: '#123456',
                  custom_icon: 'star',
                },
              },
            ],
          },
        },
        scope,
      );
      expect(
        (
          await pool.query<Record<string, unknown>>(
            'SELECT description FROM linktrees WHERE id=$1',
            [pageId],
          )
        ).rows[0].description,
      ).toBe('');
      expect(
        (
          await pool.query<Record<string, unknown>>(
            'SELECT id,display_name,original_input,country_code,gps_lat,gps_lng,custom_color,custom_icon FROM links WHERE linktree_id=$1',
            [pageId],
          )
        ).rows[0],
      ).toMatchObject({
        id: linkId,
        display_name: 'Edited',
        original_input: 'example.com',
        country_code: 'IQ',
        custom_color: '#123456',
        custom_icon: 'star',
      });
      expect(
        (
          await pool.query<Record<string, unknown>>(
            'SELECT id FROM public_page_actions WHERE source_link_id=$1',
            [linkId],
          )
        ).rows[0].id,
      ).toBe(actionId);
      await update({ headline: 'Metadata only' }, scope);
      expect(
        (
          await pool.query<Record<string, unknown>>(
            'SELECT id FROM links WHERE linktree_id=$1',
            [pageId],
          )
        ).rows[0].id,
      ).toBe(linkId);
    },
  );

  it('rolls back page details and WhatsApp questions when link persistence fails', async () => {
    await expect(
      update({
        headline: 'Must roll back',
        template_config: {
          templateKey: 'spectrum',
          whatsapp_modal: {
            enabled: true,
            questions: [{ text: 'New question', message: 'New message' }],
          },
        },
        links: { website: ['https://example.com/reject'] },
      }),
    ).rejects.toThrow('fixture link rejected');
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT headline,whatsapp_modal_enabled FROM linktrees WHERE id=$1',
          [pageId],
        )
      ).rows[0],
    ).toMatchObject({ headline: 'Original', whatsapp_modal_enabled: false });
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT id FROM whatsapp_questions WHERE linktree_id=$1',
          [pageId],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT id FROM links WHERE linktree_id=$1',
          [pageId],
        )
      ).rows[0].id,
    ).toBe(linkId);
  });

  it('persists canonical WhatsApp settings and keeps question IDs when editing', async () => {
    await update({
      template_config: {
        templateKey: 'spectrum',
        whatsapp_modal: {
          enabled: true,
          questions: [{ text: 'Question', message: 'Message' }],
        },
      },
    });
    const question = (
      await pool.query<Record<string, unknown>>(
        'SELECT id FROM whatsapp_questions WHERE linktree_id=$1',
        [pageId],
      )
    ).rows[0];
    await update({
      template_config: {
        templateKey: 'spectrum',
        whatsapp_modal: {
          enabled: false,
          questions: [
            {
              id: question.id,
              text: 'Edited question',
              message: 'Edited message',
            },
          ],
        },
      },
    });
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT whatsapp_modal_enabled FROM linktrees WHERE id=$1',
          [pageId],
        )
      ).rows[0].whatsapp_modal_enabled,
    ).toBe(false);
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT id,question_text,message FROM whatsapp_questions WHERE linktree_id=$1',
          [pageId],
        )
      ).rows,
    ).toEqual([
      {
        id: question.id,
        question_text: 'Edited question',
        message: 'Edited message',
      },
    ]);
  });

  it.each(['logo', 'background'] as const)(
    "rejects another tenant's %s upload without changing the page",
    async (field) => {
      const url = `/images/upload/${randomUUID()}.png`;
      await pool.query<Record<string, unknown>>(
        "INSERT INTO uploaded_media_assets(storage_key,public_url,scope,owner_business_id,format,original_byte_size,stored_byte_size) VALUES($1,$2,'business',$3,'png',100,100)",
        [url.slice('/images/upload/'.length), url, owners[1]],
      );
      const changes =
        field === 'logo'
          ? { logo: url }
          : {
              template_config: {
                templateKey: 'spectrum',
                background_image: url,
              },
            };
      await expect(
        update({ headline: 'Must not save', ...changes }),
      ).rejects.toThrow('Page images must belong');
      expect(
        (
          await pool.query<Record<string, unknown>>(
            'SELECT headline FROM linktrees WHERE id=$1',
            [pageId],
          )
        ).rows[0].headline,
      ).toBe('Original');
    },
  );

  it('preserves identity and metadata through the caller-owned sync transaction', async () => {
    await transaction((client) =>
      syncLinksInTransaction(
        client,
        pageId,
        [
          {
            platform: 'website',
            url: 'https://example.com',
            metadata: {
              custom_color: '#abcdef',
              custom_icon: 'star',
              original_input: 'example.com',
            },
          },
        ],
        owners[0],
      ),
    );
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT id,custom_color,custom_icon,original_input FROM links WHERE linktree_id=$1',
          [pageId],
        )
      ).rows,
    ).toEqual([
      {
        id: linkId,
        custom_color: '#abcdef',
        custom_icon: 'star',
        original_input: 'example.com',
      },
    ]);
    expect(
      (
        await pool.query<Record<string, unknown>>(
          'SELECT id FROM public_page_actions WHERE source_link_id=$1',
          [linkId],
        )
      ).rows[0].id,
    ).toBe(actionId);
  });

  it.each(['business', 'platform'] as const)(
    'persists sponsor changes and keeps engagement action identity for %s writes',
    async (scope) => {
      const sponsor = {
        enabled: true,
        style: 'text',
        name: 'Sponsor One',
        logo: null,
        url: '/',
      };
      await update(
        { template_config: { templateKey: 'spectrum', sponsor } },
        scope,
      );
      const saved = await pool.query<{ sponsor: unknown }>(
        "SELECT template_config->'sponsor' AS sponsor FROM linktrees WHERE id=$1",
        [pageId],
      );
      expect(saved.rows[0].sponsor).toEqual(sponsor);
      const action = await pool.query<{
        id: string;
        metadata: unknown;
        status: string;
        destination: string;
      }>(
        "SELECT action.id,action.metadata,action.status,action.destination FROM public_page_actions action JOIN public_pages page ON page.id=action.public_page_id WHERE page.source_linktree_id=$1 AND action.action_key='page:sponsor-click'",
        [pageId],
      );
      expect(action.rows[0]).toMatchObject({
        metadata: { engagement_only: true, measurement: 'sponsor' },
        status: 'active',
        destination: '/',
      });
      const actionId = action.rows[0].id;
      await update(
        {
          template_config: {
            templateKey: 'spectrum',
            sponsor: {
              ...sponsor,
              name: 'Sponsor Two',
              url: 'https://example.com/sponsor',
            },
          },
        },
        scope,
      );
      expect(
        (
          await pool.query<{ id: string; label: string; destination: string }>(
            'SELECT id,label,destination FROM public_page_actions WHERE id=$1',
            [actionId],
          )
        ).rows[0],
      ).toEqual({
        id: actionId,
        label: 'Sponsor Two',
        destination: 'https://example.com/sponsor',
      });
      await update(
        {
          template_config: {
            templateKey: 'spectrum',
            sponsor: { ...sponsor, enabled: false },
          },
        },
        scope,
      );
      expect(
        (
          await pool.query<{ status: string }>(
            'SELECT status FROM public_page_actions WHERE id=$1',
            [actionId],
          )
        ).rows[0].status,
      ).toBe('hidden');
      await update(
        { template_config: { templateKey: 'spectrum', sponsor } },
        scope,
      );
      await pool.query(
        readFileSync(
          join(
            __dirname,
            '../src/database/migrations/2026-10-31_linktree_sponsor_actions.sql',
          ),
          'utf8',
        ),
      );
      await pool.query(
        readFileSync(
          join(
            __dirname,
            '../src/database/migrations/2026-10-31_linktree_sponsor_contacts.sql',
          ),
          'utf8',
        ),
      );
      expect(
        (
          await pool.query<{ id: string; status: string }>(
            'SELECT id,status FROM public_page_actions WHERE id=$1',
            [actionId],
          )
        ).rows[0],
      ).toEqual({ id: actionId, status: 'active' });
    },
  );

  it.each(['business', 'platform'] as const)(
    'persists a nameless wordmark, custom introduction and contact action for %s',
    async (scope) => {
      const logo = `/images/upload/${randomUUID()}.png`;
      await pool.query(
        "INSERT INTO uploaded_media_assets(storage_key,public_url,scope,owner_business_id,format,original_byte_size,stored_byte_size) VALUES($1,$2,'business',$3,'png',100,100)",
        [logo.slice('/images/upload/'.length), logo, owners[0]],
      );
      const sponsor = {
        enabled: true,
        style: 'wordmark',
        name: '',
        logo,
        intro: 'Custom introduction',
        url: 'tel:+9647501234567',
      };
      await update(
        { template_config: { templateKey: 'spectrum', sponsor } },
        scope,
      );
      expect(
        (
          await pool.query<{ sponsor: unknown }>(
            "SELECT template_config->'sponsor' AS sponsor FROM linktrees WHERE id=$1",
            [pageId],
          )
        ).rows[0].sponsor,
      ).toEqual(sponsor);
      const action = await pool.query<{
        id: string;
        destination: string;
        label: string;
      }>(
        "SELECT action.id,action.destination,action.label FROM public_page_actions action JOIN public_pages page ON page.id=action.public_page_id WHERE page.source_linktree_id=$1 AND action.action_key='page:sponsor-click'",
        [pageId],
      );
      expect(action.rows[0]).toMatchObject({
        label: 'Sponsor',
        destination: sponsor.url,
      });
      await pool.query(
        readFileSync(
          join(
            __dirname,
            '../src/database/migrations/2026-10-31_linktree_sponsor_contacts.sql',
          ),
          'utf8',
        ),
      );
      expect(
        (
          await pool.query<{ id: string; status: string }>(
            'SELECT id,status FROM public_page_actions WHERE id=$1',
            [action.rows[0].id],
          )
        ).rows[0],
      ).toEqual({ id: action.rows[0].id, status: 'active' });
      await update(
        {
          template_config: {
            templateKey: 'spectrum',
            sponsor: {
              ...sponsor,
              intro: '',
              url: 'https://wa.me/9647501234567',
            },
          },
        },
        scope,
      );
      expect(
        (
          await pool.query<{ destination: string }>(
            'SELECT destination FROM public_page_actions WHERE id=$1',
            [action.rows[0].id],
          )
        ).rows[0].destination,
      ).toBe('https://wa.me/9647501234567');
    },
  );

  it('rejects a foreign sponsor wordmark before changing page content or action destination', async () => {
    const url = `/images/upload/${randomUUID()}.png`;
    await pool.query(
      "INSERT INTO uploaded_media_assets(storage_key,public_url,scope,owner_business_id,format,original_byte_size,stored_byte_size) VALUES($1,$2,'business',$3,'png',100,100)",
      [url.slice('/images/upload/'.length), url, owners[1]],
    );
    await expect(
      update({
        headline: 'Must not save',
        template_config: {
          sponsor: {
            enabled: true,
            style: 'wordmark',
            name: 'Foreign',
            logo: url,
            url: '/',
          },
        },
      }),
    ).rejects.toThrow('Page images must belong');
    expect(
      (
        await pool.query<{ headline: string }>(
          'SELECT headline FROM linktrees WHERE id=$1',
          [pageId],
        )
      ).rows[0].headline,
    ).toBe('Original');
    expect(
      (
        await pool.query(
          "SELECT action.id FROM public_page_actions action JOIN public_pages page ON page.id=action.public_page_id WHERE page.source_linktree_id=$1 AND action.action_key='page:sponsor-click'",
          [pageId],
        )
      ).rows,
    ).toHaveLength(0);
  });
});
