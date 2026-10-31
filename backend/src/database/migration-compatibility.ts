import type { PoolClient } from 'pg';

export const REQUIRED_TABLES = [
  'businesses',
  'business_sessions',
  'business_branding',
  'business_defaults',
  'platform_admins',
  'platform_admin_sessions',
  'auth_permissions',
  'billing_entitlements',
  'schema_migrations',
  'linktrees',
  'links',
  'communication_announcements',
  'communication_notifications',
  'communication_conversations',
  'communication_messages',
  'platform_data_retention_settings',
  'platform_data_retention_runs',
  'platform_media_settings',
  'uploaded_media_assets',
  'public_page_tombstones',
  'root_public_slugs',
] as const;

export const REQUIRED_COLUMNS = [
  ['businesses', 'onboarding_step'],
  ['businesses', 'onboarding_version'],
  ['businesses', 'onboarding_completed_at'],
  ['business_sessions', 'remembered'],
  ['platform_admin_sessions', 'remembered'],
  ['businesses', 'account_type'],
  ['communication_announcements', 'encrypted_content'],
  ['communication_notifications', 'encrypted_content'],
  ['communication_conversations', 'encrypted_subject'],
  ['communication_conversations', 'sponsor_krd_key'],
  ['communication_messages', 'encrypted_body'],
  ['linktrees', 'headline'],
  ['linktrees', 'slogan'],
  ['linktrees', 'logo'],
  ['linktrees', 'slogan_color'],
  ['linktrees', 'is_pinned'],
  ['forms', 'is_pinned'],
  ['linktrees', 'is_archived'],
  ['linktrees', 'archived_at'],
  ['whatsapp_questions', 'video_url'],
  ['business_defaults', 'homepage_linktree'],
] as const;

const OBSOLETE_COLUMNS: ReadonlyArray<readonly [string, string]> = [];

const LINKTREE_CONTENT_RENAMES = [
  ['headline', 'name'],
  ['slogan', 'subtitle'],
  ['logo', 'image'],
  ['slogan_color', 'subtitle_color'],
] as const;

const REQUIRED_INDEXES = [
  'idx_communication_conversations_sponsor_krd_key',
  'uq_platform_retention_running',
  'idx_uploaded_media_assets_created',
  'idx_public_page_tombstones_slug',
  'uq_businesses_one_platform_workspace',
  'idx_linktrees_business_archived',
] as const;

export async function assertSupportedSchema(
  client: PoolClient,
  options: { beforeForwardMigrations?: boolean } = {},
): Promise<void> {
  const tables = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [[...REQUIRED_TABLES]],
  );
  const foundTables = new Set(tables.rows.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter(
    (table) => !foundTables.has(table),
  );
  const columns = await client.query<{
    table_name: string;
    column_name: string;
  }>(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name, column_name) IN (
          SELECT * FROM unnest($1::text[], $2::text[])
        )`,
    [
      [
        ...REQUIRED_COLUMNS,
        ...OBSOLETE_COLUMNS,
        ...LINKTREE_CONTENT_RENAMES.map(([, legacy]) => ['linktrees', legacy]),
      ].map(([table]) => table),
      [
        ...REQUIRED_COLUMNS,
        ...OBSOLETE_COLUMNS,
        ...LINKTREE_CONTENT_RENAMES.map(([, legacy]) => ['linktrees', legacy]),
      ].map(([, column]) => column),
    ],
  );
  const foundColumns = new Set(
    columns.rows.map((row) => `${row.table_name}.${row.column_name}`),
  );
  // Only the complete previous content schema is a supported upgrade source.
  // Mixed/partial renames must still fail before any migration can mutate data.
  const legacyContent =
    options.beforeForwardMigrations === true &&
    LINKTREE_CONTENT_RENAMES.every(
      ([canonical, legacy]) =>
        !foundColumns.has(`linktrees.${canonical}`) &&
        foundColumns.has(`linktrees.${legacy}`),
    );
  const missingColumns = REQUIRED_COLUMNS.filter(
    ([table, column]) =>
      !foundColumns.has(`${table}.${column}`) &&
      !(
        options.beforeForwardMigrations &&
        column === 'is_pinned' &&
        (table === 'linktrees' || table === 'forms')
      ) &&
      !(
        options.beforeForwardMigrations &&
        table === 'whatsapp_questions' &&
        column === 'video_url'
      ) &&
      !(
        legacyContent &&
        table === 'linktrees' &&
        LINKTREE_CONTENT_RENAMES.some(([canonical]) => canonical === column)
      ) &&
      !(
        options.beforeForwardMigrations &&
        table === 'business_defaults' &&
        column === 'homepage_linktree'
      ),
  ).map(([table, column]) => `${table}.${column}`);
  const foundObsoleteColumns = OBSOLETE_COLUMNS.filter(([table, column]) =>
    foundColumns.has(`${table}.${column}`),
  ).map(([table, column]) => `${table}.${column}`);
  if (!legacyContent) {
    foundObsoleteColumns.push(
      ...LINKTREE_CONTENT_RENAMES.filter(([, legacy]) =>
        foundColumns.has(`linktrees.${legacy}`),
      ).map(([, legacy]) => `linktrees.${legacy}`),
    );
  }
  const indexes = await client.query<{ indexname: string }>(
    `SELECT indexname
       FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = ANY($1::text[])`,
    [[...REQUIRED_INDEXES]],
  );
  const foundIndexes = new Set(indexes.rows.map((row) => row.indexname));
  const missingIndexes = REQUIRED_INDEXES.filter(
    (index) => !foundIndexes.has(index),
  );

  const catalog = await client.query<{
    public_page_entitlement: boolean;
    linktree_update_fields: boolean;
    platform_content_permissions: boolean;
    platform_workspace: boolean;
  }>(`
    SELECT
      EXISTS (
        SELECT 1
          FROM billing_entitlements
         WHERE entitlement_key = 'limit.linktrees'
           AND name = 'Public page limit'
           AND unit = 'pages'
      ) AS public_page_entitlement,
      EXISTS (
        SELECT 1
          FROM auth_permissions
         WHERE permission_key = 'business:linktrees:update'
           AND field_schema ?& ARRAY[
             'status', '${legacyContent ? 'subtitle_color' : 'slogan_color'}', 'is_archived'
           ]
      ) AS linktree_update_fields,
      (
        SELECT count(*) = 7
          FROM auth_permissions
         WHERE permission_key IN (
           'platform:settings:tiktok-read',
           'platform:settings:tiktok-update',
           'platform:linktrees:read',
           'platform:linktrees:create',
           'platform:linktrees:update',
           'platform:linktrees:delete',
           'platform:linktrees:upload'
         ) AND status = 'active'
      ) AS platform_content_permissions,
      EXISTS (
        SELECT 1 FROM businesses
         WHERE id = '00000000-0000-4000-8000-000000000001'
           AND account_type = 'platform'
      ) AS platform_workspace
  `);
  const catalogState = catalog.rows[0];
  const missingCatalogEntries = [
    !catalogState?.public_page_entitlement
      ? 'limit.linktrees public-page definition'
      : null,
    !catalogState?.linktree_update_fields
      ? 'business:linktrees:update field catalog'
      : null,
    !catalogState?.platform_content_permissions
      ? 'platform content permission set'
      : null,
    !catalogState?.platform_workspace ? 'platform content workspace' : null,
  ].filter((entry): entry is string => entry !== null);

  if (
    missingTables.length ||
    missingColumns.length ||
    foundObsoleteColumns.length ||
    missingIndexes.length ||
    missingCatalogEntries.length
  ) {
    throw new Error(
      `Unsupported or partial database schema. Missing tables: ${missingTables.join(', ') || 'none'}; missing columns: ${missingColumns.join(', ') || 'none'}; obsolete columns: ${foundObsoleteColumns.join(', ') || 'none'}; missing indexes: ${missingIndexes.join(', ') || 'none'}; missing catalog entries: ${missingCatalogEntries.join(', ') || 'none'}. Restore a database that matches full_schema.sql or recreate an intentionally disposable database with db:reset. No baseline was recorded.`,
    );
  }
}
