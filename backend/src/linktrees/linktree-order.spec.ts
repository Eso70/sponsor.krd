import { buildSyncLinks } from './linktree-links';

describe('grouped Linktree ordering', () => {
  it('preserves interleaved duplicate platforms for create and platform sync', () => {
    const result = buildSyncLinks({
      name: 'Page',
      links: {
        custom: ['https://first.example', 'https://last.example'],
        instagram: ['https://instagram.com/business'],
      },
      linkMetadata: {
        custom: [{ display_order: 0 }, { display_order: 2 }],
        instagram: [{ display_order: 1 }],
      },
    });
    expect(result.map((link) => link.url)).toEqual([
      'https://first.example',
      'https://instagram.com/business',
      'https://last.example',
    ]);
  });
  it('preserves legacy order and safely ignores malformed positions', () => {
    const result = buildSyncLinks({
      name: 'Page',
      links: {
        custom: ['https://first.example', 'https://last.example'],
        instagram: ['https://instagram.com/business'],
      },
      linkMetadata: {
        custom: [{ display_order: -1 }, { display_order: '0' }],
        instagram: [{ display_order: Infinity }],
      },
    });
    expect(result.map((link) => link.url)).toEqual([
      'https://first.example',
      'https://last.example',
      'https://instagram.com/business',
    ]);
  });
});
