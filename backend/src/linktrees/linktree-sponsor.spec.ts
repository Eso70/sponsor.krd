import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  inspectLinktreeSponsor,
  readLinktreeSponsor,
} from '@linktree/types/linktree-sponsor.cjs';
import { normalizeTemplateConfig } from './linktree-template-config';
import { assertLinktreeMediaOwnership } from '../common/linktree-banner';
import { forwardsToTikTok } from '../analytics/unified-analytics.service';

const sponsor = {
  enabled: true,
  style: 'text',
  name: 'Acme',
  logo: null,
  url: '/',
};

describe('shared Linktree sponsorship contract', () => {
  it('keeps old pages disabled without inventing sponsor identity', () => {
    expect(readLinktreeSponsor(undefined)).toEqual({
      enabled: false,
      style: 'text',
      name: '',
      logo: null,
      url: null,
    });
    expect(normalizeTemplateConfig({})).not.toHaveProperty('sponsor');
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    '//evil.example',
    'https://user:password@example.com',
    '/other-page',
    'https://example.com\\@evil.test',
  ])('rejects unsafe sponsor destination %s', (url) => {
    expect(inspectLinktreeSponsor({ ...sponsor, url }).errors).toHaveProperty(
      'url',
    );
    expect(readLinktreeSponsor({ ...sponsor, url }).url).toBeNull();
    expect(() =>
      normalizeTemplateConfig({ sponsor: { ...sponsor, url } }),
    ).toThrow(BadRequestException);
  });
  it.each(['/', 'https://example.com/sponsor', 'http://example.com'])(
    'accepts a safe destination %s',
    (url) => {
      expect(inspectLinktreeSponsor({ ...sponsor, url }).errors).toEqual({});
    },
  );
  it('requires a bounded accessible name and an image in wordmark mode', () => {
    expect(
      inspectLinktreeSponsor({ ...sponsor, name: '' }).errors,
    ).toHaveProperty('name');
    expect(
      inspectLinktreeSponsor({ ...sponsor, name: 'x'.repeat(101) }).errors,
    ).toHaveProperty('name');
    expect(
      inspectLinktreeSponsor({ ...sponsor, style: 'wordmark' }).errors,
    ).toHaveProperty('logo');
    expect(
      inspectLinktreeSponsor({
        ...sponsor,
        logo: 'https://evil.example/logo.png',
      }).errors,
    ).toHaveProperty('logo');
    expect(
      inspectLinktreeSponsor({
        ...sponsor,
        logo: '/images/upload/../foreign.png',
      }).errors,
    ).toHaveProperty('logo');
    expect(
      inspectLinktreeSponsor({ ...sponsor, logo: 'data:image/png;base64,AAAA' })
        .errors,
    ).toHaveProperty('logo');
  });
  it('normalizes text safely and supports a non-clickable sponsor', () => {
    expect(
      normalizeTemplateConfig({
        sponsor: { ...sponsor, name: ' Acme ', url: '' },
      }).sponsor,
    ).toEqual({ ...sponsor, name: 'Acme', url: null });
  });
  it.each([false, true])(
    'rejects a foreign sponsor upload in both scopes (platform=%s)',
    async (platform) => {
      const storage = {
        areBusinessAssetsOwned: jest.fn().mockResolvedValue(false),
        arePlatformBrandingAssetsOwned: jest.fn().mockResolvedValue(false),
      };
      await expect(
        assertLinktreeMediaOwnership(
          storage,
          'owner',
          {
            sponsor: {
              ...sponsor,
              style: 'wordmark',
              logo: '/images/upload/foreign.png',
            },
          },
          undefined,
          platform,
        ),
      ).rejects.toThrow(ForbiddenException);
    },
  );
  it('accepts an owned wordmark and keeps engagement out of marketing delivery', async () => {
    const storage = {
      areBusinessAssetsOwned: jest.fn().mockResolvedValue(true),
    };
    await expect(
      assertLinktreeMediaOwnership(storage, 'owner', {
        sponsor: {
          ...sponsor,
          style: 'wordmark',
          logo: '/images/upload/owned.png',
        },
      }),
    ).resolves.toBeUndefined();
    expect(storage.areBusinessAssetsOwned).toHaveBeenCalledWith(
      'owner',
      '/images/upload/owned.png',
    );
    expect(
      forwardsToTikTok({
        pageType: 'linktree',
        eventName: 'action_open',
        hasAction: true,
        engagementOnly: true,
      }),
    ).toBe(false);
  });
});

describe('sponsor contact and introduction settings', () => {
  it('allows nameless wordmarks with custom or empty introductory text', () => {
    for (const intro of ['Supported by', '']) {
      const result = inspectLinktreeSponsor({
        enabled: true,
        style: 'wordmark',
        name: '',
        logo: '/images/upload/wordmark.png',
        url: 'tel:+9647501234567',
        intro,
      });
      expect(result.errors).toEqual({});
      expect(result.value).toMatchObject({
        enabled: true,
        name: '',
        intro,
        url: 'tel:+9647501234567',
      });
    }
  });
  it.each([
    'tel:123',
    'tel:+1',
    'tel:+9647501234567?x=1',
    'sms:+9647501234567',
    'https://wa.me/',
    'https://wa.me/abc',
  ])('rejects an invalid contact address %s', (url) => {
    expect(inspectLinktreeSponsor({ ...sponsor, url }).errors).toHaveProperty(
      'url',
    );
  });
  it('keeps legacy default introductions implicit and accepts WhatsApp links', () => {
    const result = inspectLinktreeSponsor({
      ...sponsor,
      url: 'https://wa.me/9647501234567',
    });
    expect(result.errors).toEqual({});
    expect(result.value).not.toHaveProperty('intro');
    expect(
      inspectLinktreeSponsor({ ...sponsor, intro: 'x'.repeat(101) }).errors,
    ).toHaveProperty('intro');
  });
});
