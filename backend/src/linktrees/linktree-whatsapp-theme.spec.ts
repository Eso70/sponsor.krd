import { normalizeTemplateConfig } from './linktree-template-config';

describe('WhatsApp question appearance', () => {
  it('keeps legacy settings compatible and normalizes only the panel color', () => {
    expect(normalizeTemplateConfig({}).whatsapp_modal).toEqual({});
    const modal = {
      enabled: true,
      backgroundColor: '#AbC',
      title: 'Contact',
      questions: [{ id: 'q', text: 'Ask', message: 'Hello' }],
    };
    const result = normalizeTemplateConfig({
      background_color: '#000000',
      whatsapp_modal: modal,
    });
    expect(result.whatsapp_modal).toEqual({
      ...modal,
      backgroundColor: '#aabbcc',
    });
    expect(modal.backgroundColor).toBe('#AbC');
  });
  it.each(['url(https://example.com)', 'red', '#fff; color:red'])(
    'does not persist unsafe panel color %s',
    (backgroundColor) => {
      expect(
        normalizeTemplateConfig({ whatsapp_modal: { backgroundColor } })
          .whatsapp_modal.backgroundColor,
      ).toBe('#ffffff');
    },
  );
});
