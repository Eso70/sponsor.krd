import {
  normalizeTemplateConfig,
  readTemplateConfig,
} from './linktree-template-config';

describe('shared public and managed template normalization', () => {
  it('keeps valid configuration identical across read and write boundaries without mutation', () => {
    const input = {
      templateKey: 'spectrum',
      background_pattern: 'invalid',
      whatsapp_modal: { backgroundColor: '#abc' },
      banner: { enabled: true, images: ['/images/upload/banner.png'] },
    };
    expect(readTemplateConfig(input)).toEqual(normalizeTemplateConfig(input));
    expect(readTemplateConfig(input).whatsapp_modal.backgroundColor).toBe(
      '#aabbcc',
    );
    expect(readTemplateConfig(input)).not.toHaveProperty('background_pattern');
    expect(input.whatsapp_modal.backgroundColor).toBe('#abc');
  });
  it('sanitizes old invalid sponsorship on reads while rejecting it on writes', () => {
    const input = {
      sponsor: {
        enabled: true,
        style: 'text',
        name: 'Sponsor',
        url: 'javascript:alert(1)',
      },
    };
    expect(() => normalizeTemplateConfig(input)).toThrow(
      'Invalid sponsor settings',
    );
    expect(readTemplateConfig(input).sponsor).toMatchObject({ url: null });
  });
});
