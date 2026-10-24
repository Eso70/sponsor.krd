import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { FormDraft } from '@linktree/types';
import { FormsService } from './forms.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { UnifiedAnalyticsService } from '../analytics/unified-analytics.service';
import { PublicPageAnalyticsService } from '../analytics/public-page-analytics.service';

const source: FormDraft = {
  id: 'source',
  name: 'Contact',
  slug: 'contact',
  headline: 'Original',
  status: 'active',
  layout: 'form',
  language: 'en',
  appearance: 'light',
  description: '',
  purpose: '',
  banner: '',
  logo: '',
  blocks: [],
  questions: [
    { id: 'phone', type: 'phone', label: 'Phone', required: true, options: [] },
  ],
  consentRequired: true,
  finalTitle: '',
  finalDescription: '',
  buttonText: '',
  buttonUrl: '',
  updatedAt: '2026-10-15T00:00:00Z',
  revision: 8,
  submissionCount: 25,
  isArchived: true,
};
function fixture(owner = 'owner') {
  const owned = jest.fn().mockResolvedValue(true);
  const reserved = new Set<string>();
  const row = {
    ...source,
    business_id: owner,
    definition: structuredClone(source),
    revision: 8,
    submission_count: 25,
    is_archived: true,
    archived_at: source.updatedAt,
    updated_at: source.updatedAt,
  };
  const client = {
    query: jest.fn(async (sql: string, args: unknown[] = []) => {
      if (sql.startsWith('SELECT 1'))
        return {
          rows: reserved.has(String(args[1])) ? [{ exists: true }] : [],
        };
      if (sql.startsWith('INSERT INTO forms'))
        return {
          rows: [
            {
              ...row,
              id: 'new-id',
              name: args[2],
              slug: args[1],
              definition: JSON.parse(String(args[3])) as FormDraft,
              status: args[4],
              is_archived: false,
              archived_at: null,
              submission_count: 0,
              revision: 1,
            },
          ],
        };
      return { rows: [] };
    }),
  };
  const db = {
    query: jest.fn(async (sql: string, args: unknown[] = []) => {
      if (sql.startsWith('SELECT slug'))
        return { rows: [...reserved].map((slug) => ({ slug })) };
      if (sql.startsWith('SELECT *'))
        return { rows: args[0] === owner ? [row] : [] };
      return { rows: reserved.has(String(args[1])) ? [{ exists: true }] : [] };
    }),
    transaction: jest.fn(
      async (work: (value: typeof client) => Promise<unknown>) => work(client),
    ),
  };
  const service = new FormsService(
    db as unknown as DatabaseService,
    {} as PlatformContentWorkspaceService,
    { areBusinessAssetsOwned: owned } as unknown as StorageService,
    {} as UnifiedAnalyticsService,
    {} as PublicPageAnalyticsService,
  );
  return { service, owned, reserved, client, db, row };
}
describe('editable owner-scoped form duplication', () => {
  it.each(['business-owner', 'platform-owner'])(
    'creates an independent customized copy for %s',
    async (owner) => {
      const { service, client, row, owned } = fixture(owner);
      const before = structuredClone(row);
      const definition = {
        ...source,
        name: 'New contact',
        headline: 'New headline',
        description: 'New description',
        slogan: 'New slogan',
        color: '#ff0000',
        banner: '/images/upload/new.png',
        logo: '/images/upload/logo.png',
      };
      const result = await service.duplicate(owner, source.id, {
        definition,
        slug: 'new-contact',
      });
      expect(result).toMatchObject({
        id: 'new-id',
        slug: 'new-contact',
        name: definition.name,
        headline: definition.headline,
        description: definition.description,
        slogan: definition.slogan,
        color: definition.color,
        status: 'paused',
        isArchived: false,
        submissionCount: 0,
        revision: 1,
      });
      expect(row).toEqual(before);
      expect(owned).toHaveBeenCalledWith(
        owner,
        expect.objectContaining({
          banner: definition.banner,
          logo: definition.logo,
        }),
      );
      expect(client.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('pg_advisory_xact_lock'),
        [`forms:${owner}`],
      );
      expect(
        client.query.mock.calls.some(([sql]) =>
          /UPDATE|form_submissions/.test(sql),
        ),
      ).toBe(false);
    },
  );
  it('checks ownership before returning source data or checking an address', async () => {
    const { service, db } = fixture();
    await expect(
      service.duplicateOptions('other-owner', source.id, 'new-contact'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.duplicate('other-owner', source.id, {
        definition: source,
        slug: 'new-contact',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('suggests another address on repeated copies and fits long titles', async () => {
    const { service, reserved, row } = fixture();
    reserved.add('contact-copy');
    expect(await service.duplicateOptions('owner', source.id)).toMatchObject({
      name: 'Contact (copy 2)',
      slug: 'contact-copy-2',
      available: true,
    });
    row.name = 'a'.repeat(100);
    const next = await service.duplicateOptions('owner', source.id);
    expect(next.slug.length).toBeLessThanOrEqual(50);
    expect(next.slug).toMatch(/-copy$/);
    expect(next.name!.length).toBeLessThanOrEqual(100);
  });
  it('rejects a destination reserved after the advisory check', async () => {
    const { service, reserved, client } = fixture();
    reserved.add('taken');
    await expect(
      service.duplicate('owner', source.id, {
        definition: source,
        slug: 'taken',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      client.query.mock.calls.some(([sql]) => sql.startsWith('INSERT')),
    ).toBe(false);
  });
  it('rejects foreign media and invalid form definitions before insertion', async () => {
    const { service, owned, db } = fixture();
    owned.mockResolvedValue(false);
    await expect(
      service.duplicate('owner', source.id, {
        definition: { ...source, logo: '/images/upload/foreign.png' },
        slug: 'new-contact',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.duplicate('owner', source.id, {
        definition: { ...source, name: '' },
        slug: 'new-contact',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.duplicateOptions('owner', source.id, '../unsafe'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
