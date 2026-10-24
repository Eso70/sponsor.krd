import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DuplicateLinktreeDto } from './duplicate-linktree.dto';

describe('duplicate appearance validation', () => {
  it('accepts banner, text, colors and explicit media removal', () => {
    const value = plainToInstance(DuplicateLinktreeDto, {
      headline: 'Copy',
      slug: 'new-copy',
      slogan: '',
      slogan_color: null,
      description: 'Different description',
      logo: null,
      background_image: null,
      background_color: '#ffffff',
      background_pattern: 'dots',
      banner: {
        enabled: true,
        mode: 'carousel',
        images: ['/images/upload/banner.png'],
      },
    });
    expect(validateSync(value)).toHaveLength(0);
  });
  it.each([
    { banner: [] },
    { banner: { enabled: true, mode: 'video', images: [] } },
    {
      banner: {
        enabled: true,
        mode: 'image',
        images: ['https://example.com/image.png'],
      },
    },
    {
      banner: {
        enabled: true,
        mode: 'carousel',
        images: Array(6).fill('/images/upload/banner.png'),
      },
    },
    { background_color: 'url(https://example.com)' },
    { background_image: 'https://example.com/image.png' },
    { background_pattern: 'unknown' },
    { slug: 'not valid' },
  ])('rejects malformed duplicate overrides: %j', (body) => {
    expect(
      validateSync(plainToInstance(DuplicateLinktreeDto, body)).length,
    ).toBeGreaterThan(0);
  });
});
