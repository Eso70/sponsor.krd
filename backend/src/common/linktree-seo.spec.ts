import {
  inspectLinktreeSeo,
  readPlanLinktreeSeo,
  LINKTREE_CATEGORIES,
  LINKTREE_BUSINESS_TYPES,
} from '@linktree/types/linktree-seo.cjs';
import {
  linktreeSeoWriteChanged,
  normalizeLinktreeSeoConfig,
} from './linktree-seo';
import { assertLinktreeBannerOwnership } from './linktree-banner';
import { spawnSync } from 'node:child_process';

describe('versioned owner SEO settings', () => {
  it('rejects coerced time values and falsy non-string settings', () => {
    for (const opens of [['09:00'], 900, false, { value: '09:00' }]) {
      expect(
        inspectLinktreeSeo({
          version: 1,
          business: { hours: { days: ['Mo'], opens, closes: '18:00' } },
        }).errors['business.hours'],
      ).toBe('invalid');
    }
    expect(
      inspectLinktreeSeo({
        version: 1,
        business: {
          hours: { days: ['Mo'], opens: '09:00', closes: ['18:00'] },
        },
      }).errors['business.hours'],
    ).toBe('invalid');
    for (const field of ['category', 'businessType', 'socialImage'])
      for (const value of [0, false]) {
        expect(
          inspectLinktreeSeo({ version: 1, [field]: value }).errors[field],
        ).toBe('invalid');
      }
  });
  it('loads in the actual Node runtime without a TypeScript loader', () => {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        "process.stdout.write(JSON.stringify(require('@linktree/types/linktree-seo.cjs').inspectLinktreeSeo({version:1,category:'food'})))",
      ],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({
      value: { category: 'food' },
    });
  });
  it('has localized stable IDs and valid category/type mappings', () => {
    expect(new Set(LINKTREE_CATEGORIES.map((item) => item.id)).size).toBe(
      LINKTREE_CATEGORIES.length,
    );
    for (const item of [...LINKTREE_CATEGORIES, ...LINKTREE_BUSINESS_TYPES]) {
      for (const language of ['en', 'ckb', 'ar'] as const)
        expect(item.labels[language]).toBeTruthy();
    }
    for (const category of LINKTREE_CATEGORIES)
      for (const type of category.types) {
        expect(LINKTREE_BUSINESS_TYPES.some((item) => item.id === type)).toBe(
          true,
        );
      }
  });
  it('ignores legacy settings and rejects invalid new settings on writes', () => {
    const legacy = { seo: { title: 'Retired', robotsIndex: true } };
    normalizeLinktreeSeoConfig(legacy, true);
    expect(legacy).toEqual({});
    expect(() =>
      normalizeLinktreeSeoConfig(
        { seo: { version: 1, category: 'invalid' } },
        true,
      ),
    ).toThrow();
    expect(
      inspectLinktreeSeo({
        version: 1,
        category: 'food',
        businessType: 'hotel',
      }).errors,
    ).toHaveProperty('businessType');
    expect(
      inspectLinktreeSeo({ version: 1, title: '😀'.repeat(151) }).errors,
    ).toHaveProperty('title');
  });
  it('preserves authored details without inventing hours or permitting remote images', () => {
    expect(inspectLinktreeSeo({ version: 1, category: 'food' }).value).toEqual({
      version: 1,
      category: 'food',
    });
    expect(
      inspectLinktreeSeo({
        version: 1,
        business: { hours: { days: [], opens: '', closes: '' } },
      }).errors['business.hours'],
    ).toBe('invalid');
    for (const socialImage of [
      'https://evil.test/image.png',
      '/images/upload/../secret.png',
      'data:image/png;base64,YQ==',
    ]) {
      expect(
        inspectLinktreeSeo({ version: 1, socialImage }).errors,
      ).toHaveProperty('socialImage');
    }
    expect(
      inspectLinktreeSeo(
        { version: 1, socialImage: 'data:image/png;base64,YQ==' },
        true,
      ).errors,
    ).toEqual({});
  });
  it('checks social image ownership on SEO-only updates', async () => {
    const storage = {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(false),
    };
    await expect(
      assertLinktreeBannerOwnership(storage, 'tenant-a', {
        seo: { version: 1, socialImage: '/images/upload/tenant-b.png' },
      }),
    ).rejects.toThrow();
    expect(storage.areBusinessAssetsOwned).toHaveBeenCalledWith('tenant-a', [
      '/images/upload/tenant-b.png',
    ]);
    storage.areBusinessAssetsOwned.mockResolvedValue(true);
    await expect(
      assertLinktreeBannerOwnership(storage, 'tenant-a', {
        seo: { version: 1, socialImage: '/images/upload/own.png' },
      }),
    ).resolves.toBeUndefined();
  });
});

describe('Max-only Linktree SEO', () => {
  const saved = {
    version: 1,
    title: 'Custom title',
    category: 'food',
    indexing: 'noindex',
  };
  it('uses basic automatic SEO on lower plans while preserving explicit noindex', () => {
    expect(readPlanLinktreeSeo(saved, false)).toEqual({
      version: 1,
      indexing: 'noindex',
    });
    expect(
      readPlanLinktreeSeo({ version: 1, title: 'Paid title' }, false),
    ).toBeUndefined();
    expect(readPlanLinktreeSeo(saved, true)).toEqual(saved);
  });
  it('retains stored settings when an unrelated older client omits them', () => {
    const next: Record<string, unknown> = { buttonStyle: 'pill' };
    expect(linktreeSeoWriteChanged(next, { seo: saved })).toBe(false);
    expect(next.seo).toEqual(saved);
    expect(linktreeSeoWriteChanged({ seo: { ...saved } }, { seo: saved })).toBe(
      false,
    );
    expect(
      linktreeSeoWriteChanged(
        { seo: { version: 1, title: 'New' } },
        { seo: saved },
      ),
    ).toBe(true);
    expect(linktreeSeoWriteChanged({ seo: { version: 1 } })).toBe(false);
  });
});
