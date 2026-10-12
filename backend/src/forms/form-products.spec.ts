import { randomUUID } from 'crypto';
import type { FormQuestion, FormDraft } from '@linktree/types';
import { priceProductAnswer } from './form-products';
import { validateDefinition, validateSubmission } from './form-validation';
import { PRIVACY_VERSION } from '../common/legal-versions';

const product: FormQuestion = {
  id: 'products',
  type: 'product',
  label: 'Materials',
  required: true,
  options: [],
  productSelection: {
    currency: 'USD',
    items: [
      { id: 'cement', name: 'Cement', unit: 'bag', unitPrice: 7 },
      { id: 'steel', name: 'Steel', unit: 'meter', unitPrice: 2.5 },
    ],
  },
};
const definition = (): FormDraft => ({
  id: randomUUID(),
  name: 'Materials',
  headline: '',
  status: 'active',
  layout: 'form',
  language: 'en',
  appearance: 'light',
  description: '',
  purpose: '',
  banner: '',
  logo: '',
  questions: [product],
  blocks: [],
  consentRequired: true,
  finalTitle: 'Thanks',
  finalDescription: '',
  buttonText: '',
  buttonUrl: '',
  updatedAt: new Date().toISOString(),
  actionsEnabled: false,
});
describe('authoritative product prices', () => {
  it('validates published product definitions and stores a server-built answer snapshot', () => {
    const form = validateDefinition(definition(), true);
    const result = validateSubmission(
      {
        privacyVersion: PRIVACY_VERSION,
        requestId: randomUUID(),
        revision: 1,
        consent: true,
        phoneCountryCodes: {},
        answers: { products: '{"cement":"8"}' },
        tracking: { visitorId: 'visitor-id', sessionId: 'session-id' },
      },
      form,
    );
    expect(result.answers[0].products).toMatchObject({
      currency: 'USD',
      total: 56,
    });
    expect(result.answers[0].value).toContain('Cement: 8 bag × 7 USD = 56 USD');
  });
  it('saves incomplete price lists as drafts but blocks publishing them', () => {
    const form = {
      ...definition(),
      questions: [
        {
          ...product,
          productSelection: {
            currency: 'USD' as const,
            items: [{ id: 'item', name: '', unit: '', unitPrice: null }],
          },
        },
      ],
    };
    expect(validateDefinition(form, false).questions[0].type).toBe('product');
    expect(() => validateDefinition(form, true)).toThrow();
  });
  it.each([-1, 10_000_001, 1.001])(
    'rejects invalid unit price %s on drafts too',
    (price) => {
      const form = {
        ...definition(),
        questions: [
          {
            ...product,
            productSelection: {
              currency: 'USD' as const,
              items: [
                { id: 'item', name: 'Product', unit: '', unitPrice: price },
              ],
            },
          },
        ],
      };
      expect(() => validateDefinition(form, false)).toThrow();
    },
  );
  it('calculates decimal quantities from the saved price list', () => {
    expect(priceProductAnswer(product, '{"cement":"8","steel":"1.5"}')).toEqual(
      {
        currency: 'USD',
        total: 59.75,
        items: [
          {
            id: 'cement',
            name: 'Cement',
            unit: 'bag',
            quantity: 8,
            unitPrice: 7,
            lineTotal: 56,
          },
          {
            id: 'steel',
            name: 'Steel',
            unit: 'meter',
            quantity: 1.5,
            unitPrice: 2.5,
            lineTotal: 3.75,
          },
        ],
      },
    );
  });
  it.each([
    '{"cement":"-1"}',
    '{"cement":"1e3"}',
    '{"cement":"100001"}',
    '{"cement":"0.0001"}',
    '{"other":"1"}',
    '{"cement":2}',
    '{"cement":"8","unitPrice":"1"}',
    '[]',
    'null',
    'invalid',
    '{}',
  ])('rejects invalid, forged or missing required selections: %s', (raw) =>
    expect(() => priceProductAnswer(product, raw)).toThrow(),
  );
  it('allows an empty optional selection without fabricating a purchase', () => {
    expect(priceProductAnswer({ ...product, required: false }, '')).toEqual({
      currency: 'USD',
      items: [],
      total: 0,
    });
  });
  it('rounds using integer arithmetic at supported upper limits', () => {
    const question = {
      ...product,
      productSelection: {
        currency: 'USD' as const,
        items: [
          { id: 'item', name: 'Product', unit: '', unitPrice: 9_999_999.99 },
        ],
      },
    };
    expect(priceProductAnswer(question, '{"item":"99999.999"}').total).toBe(
      999999989000,
    );
  });
});
