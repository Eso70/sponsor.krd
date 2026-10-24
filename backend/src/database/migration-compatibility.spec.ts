import {
  assertSupportedSchema,
  REQUIRED_COLUMNS,
  REQUIRED_TABLES,
} from './migration-compatibility';

function clientWithSchema(
  tables: string[],
  columns: string[],
  indexes = [
    'idx_communication_conversations_sponsor_krd_key',
    'uq_platform_retention_running',
    'idx_uploaded_media_assets_created',
    'idx_public_page_tombstones_slug',
    'uq_businesses_one_platform_workspace',
    'idx_linktrees_business_archived',
  ],
  catalog = {
    public_page_entitlement: true,
    linktree_update_fields: true,
    platform_content_permissions: true,
    platform_workspace: true,
  },
  contentColorField = 'slogan_color',
) {
  return {
    query: jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('information_schema.tables')) {
        return Promise.resolve({
          rows: tables.map((table_name) => ({ table_name })),
        });
      }
      if (sql.includes('pg_indexes')) {
        return Promise.resolve({
          rows: indexes.map((indexname) => ({ indexname })),
        });
      }
      if (sql.includes('AS public_page_entitlement')) {
        return Promise.resolve({
          rows: [
            {
              ...catalog,
              linktree_update_fields:
                catalog.linktree_update_fields &&
                sql.includes(`'${contentColorField}'`),
            },
          ],
        });
      }
      return Promise.resolve({
        rows: columns.map((value) => {
          const [table_name, column_name] = value.split('.');
          return { table_name, column_name };
        }),
      });
    }),
  } as never;
}

describe('migration compatibility checks', () => {
  const requiredColumns = REQUIRED_COLUMNS.map(
    ([table, column]) => `${table}.${column}`,
  );
  it('allows pins to be added without resetting an existing database', async () => {
    const columns = requiredColumns.filter(
      (column) => !column.endsWith('.is_pinned'),
    );
    await expect(
      assertSupportedSchema(clientWithSchema([...REQUIRED_TABLES], columns), {
        beforeForwardMigrations: true,
      }),
    ).resolves.toBeUndefined();
    await expect(
      assertSupportedSchema(clientWithSchema([...REQUIRED_TABLES], columns)),
    ).rejects.toThrow('is_pinned');
  });
  it('accepts the previous campaign column before the retirement migration', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema(
          [...REQUIRED_TABLES],
          [...requiredColumns, 'linktrees.is_campaign_active'],
        ),
        { beforeForwardMigrations: true },
      ),
    ).resolves.toBeUndefined();
  });
  it('allows the optional video column to be added by a forward migration, then requires it', async () => {
    const columns = requiredColumns.filter(
      (column) => column !== 'whatsapp_questions.video_url',
    );
    await expect(
      assertSupportedSchema(clientWithSchema([...REQUIRED_TABLES], columns), {
        beforeForwardMigrations: true,
      }),
    ).resolves.toBeUndefined();
    await expect(
      assertSupportedSchema(clientWithSchema([...REQUIRED_TABLES], columns)),
    ).rejects.toThrow('whatsapp_questions.video_url');
  });
  const legacyColumns = requiredColumns.map((column) => {
    const aliases: Record<string, string> = {
      'linktrees.headline': 'linktrees.name',
      'linktrees.slogan': 'linktrees.subtitle',
      'linktrees.logo': 'linktrees.image',
      'linktrees.slogan_color': 'linktrees.subtitle_color',
    };
    return aliases[column] || column;
  });

  it('accepts the complete previous schema and field catalog before forwards', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema(
          [...REQUIRED_TABLES],
          legacyColumns,
          undefined,
          undefined,
          'subtitle_color',
        ),
        { beforeForwardMigrations: true },
      ),
    ).resolves.toBeUndefined();
  });

  it('requires canonical columns after forward migrations', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema([...REQUIRED_TABLES], legacyColumns),
      ),
    ).rejects.toThrow(/linktrees.headline/);
  });

  it('rejects partial renames before forward migrations', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema(
          [...REQUIRED_TABLES],
          legacyColumns.map((column) =>
            column === 'linktrees.name' ? 'linktrees.headline' : column,
          ),
        ),
        { beforeForwardMigrations: true },
      ),
    ).rejects.toThrow(/Unsupported or partial database schema/);
  });

  it('rejects ambiguous canonical and legacy columns before forward migrations', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema(
          [...REQUIRED_TABLES],
          [...requiredColumns, ...legacyColumns],
        ),
        { beforeForwardMigrations: true },
      ),
    ).rejects.toThrow(/obsolete columns: linktrees.name/);
  });

  it('still rejects unrelated missing columns on the previous schema', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema(
          [...REQUIRED_TABLES],
          legacyColumns.filter(
            (column) => column !== 'businesses.account_type',
          ),
          undefined,
          undefined,
          'subtitle_color',
        ),
        { beforeForwardMigrations: true },
      ),
    ).rejects.toThrow(/businesses.account_type/);
  });

  it('accepts the complete supported structure', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema([...REQUIRED_TABLES], requiredColumns),
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects partial schemas without mutating them', async () => {
    await expect(
      assertSupportedSchema(clientWithSchema(['businesses'], [])),
    ).rejects.toThrow(/Unsupported or partial database schema/);
  });

  it('rejects a schema missing a required index', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema([...REQUIRED_TABLES], requiredColumns, []),
      ),
    ).rejects.toThrow(/missing indexes/);
  });

  it('rejects a schema with an outdated required catalog', async () => {
    await expect(
      assertSupportedSchema(
        clientWithSchema([...REQUIRED_TABLES], requiredColumns, undefined, {
          public_page_entitlement: false,
          linktree_update_fields: true,
          platform_content_permissions: true,
          platform_workspace: true,
        }),
      ),
    ).rejects.toThrow(/missing catalog entries/);
  });
});
