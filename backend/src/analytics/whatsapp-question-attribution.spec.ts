import type { PoolClient } from 'pg';
import { whatsappQuestionAttribution } from './whatsapp-question-attribution';
const page = { id: 'page-owned', business_id: 'owner', page_type: 'linktree' };
describe('WhatsApp question attribution', () => {
  it('uses a saved page-owned label and removes message/video claims', async () => {
    const query = jest
      .fn()
      .mockResolvedValue({ rows: [{ id: 'q1', label: 'Saved question' }] });
    const result = await whatsappQuestionAttribution(
      { query } as unknown as PoolClient,
      page,
      { action_type: 'whatsapp' },
      'whatsapp_click',
      {
        whatsappQuestionId: 'q1',
        whatsappQuestionLabel: 'Forged label',
        whatsappQuestionMessage: 'private message',
        whatsappQuestionVideoUrl: 'https://video.example/',
        destination: 'https://wa.me/9647500000000?text=private',
      },
    );
    expect(result).toEqual({
      whatsappQuestionId: 'q1',
      whatsappQuestionLabel: 'Saved question',
      destination: 'https://wa.me/9647500000000',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('tree.business_id=page.business_id'),
      ['page-owned', 'q1', 'owner'],
    );
  });
  it('cannot attribute an unknown or another page question from a client label', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const result = await whatsappQuestionAttribution(
      { query } as unknown as PoolClient,
      page,
      { action_type: 'whatsapp' },
      'whatsapp_click',
      { whatsappQuestionId: 'not-owned', whatsappQuestionLabel: 'Other owner' },
    );
    expect(result).toEqual({});
  });
  it('ignores malformed or unowned chooser link identities', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const client = { query } as unknown as PoolClient;
    expect(
      await whatsappQuestionAttribution(client, page, null, 'action_open', {
        measurement: 'whatsapp_questions',
        step: 'opened',
        linkId: 'invalid',
      }),
    ).toEqual({});
    expect(query).not.toHaveBeenCalled();
    expect(
      await whatsappQuestionAttribution(client, page, null, 'action_open', {
        measurement: 'whatsapp_questions',
        step: 'dismissed',
        linkId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toEqual({});
  });
});
