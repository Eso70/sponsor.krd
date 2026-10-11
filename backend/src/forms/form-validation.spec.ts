import { randomUUID } from 'crypto';
import { PRIVACY_VERSION } from '../common/legal-versions';
import type { FormDraft } from '@linktree/types';
import { validateDefinition, validateSubmission } from './form-validation';
const form = (): FormDraft => ({
  id: randomUUID(),
  name: 'Contact',
  headline: 'Contact',
  status: 'paused',
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
  updatedAt: new Date().toISOString(),
});
const input = () => ({
  privacyVersion: PRIVACY_VERSION,
  requestId: randomUUID(),
  revision: 1,
  answers: { phone: '750 123 4567' },
  phoneCountryCodes: { phone: '964' },
  consent: true,
  tracking: {
    visitorId: 'visitor-id',
    sessionId: 'session-id',
    pageUrl: 'https://tenant.sponsor.krd/form/contact',
  },
});
describe('form configuration and response validation', () => {
  it('derives names from the introduction and rejects injected fields', () => {
    expect(validateDefinition({ ...form(), name: 'spoof' }, true).name).toBe(
      'Contact',
    );
    expect(() =>
      validateDefinition({ ...form(), business_id: randomUUID() }, true),
    ).toThrow();
  });
  it('allows incomplete drafts but refuses to publish blank choices', () => {
    const draft = {
      ...form(),
      questions: [
        {
          id: 'choice',
          type: 'choice',
          label: '',
          options: ['', ''],
          required: true,
        },
      ],
    };
    expect(validateDefinition(draft, false)).toBeDefined();
    expect(() => validateDefinition(draft, true)).toThrow();
  });
  it('refuses unsafe images, URLs, oversized payloads and repeated question IDs', () => {
    expect(() =>
      validateDefinition(
        { ...form(), banner: 'https://evil.test/pixel' },
        true,
      ),
    ).toThrow();
    expect(() =>
      validateDefinition({ ...form(), buttonUrl: 'javascript:alert(1)' }, true),
    ).toThrow();
    expect(() =>
      validateDefinition(
        { ...form(), questions: Array(51).fill(form().questions[0]) },
        true,
      ),
    ).toThrow();
  });
  it('normalizes international phone numbers and retains server-owned labels', () => {
    expect(validateSubmission(input(), form()).answers).toEqual([
      { questionId: 'phone', label: 'Phone', value: '+9647501234567' },
    ]);
  });
  it('accepts Iraqi domestic and matching international numbers without duplicating the prefix', () => {
    for (const phone of ['07501234567', '+964 7501234567'])
      expect(
        validateSubmission({ ...input(), answers: { phone } }, form())
          .answers[0].value,
      ).toBe('+9647501234567');
    expect(() =>
      validateSubmission(
        { ...input(), answers: { phone: '+447501234567' } },
        form(),
      ),
    ).toThrow();
  });
  it('requires a fresh privacy acknowledgement and preserves structural fields', () => {
    expect(() =>
      validateSubmission({ ...input(), privacyVersion: '2020-01-01' }, form()),
    ).toThrow('Privacy policy changed');
    const { finalTitle: _title, ...incomplete } = form();
    expect(() => validateDefinition(incomplete, false)).toThrow();
  });
  it('rejects missing consent, unknown questions, malformed phone and oversized answers', () => {
    expect(() =>
      validateSubmission({ ...input(), consent: false }, form()),
    ).toThrow();
    expect(() =>
      validateSubmission({ ...input(), answers: { unknown: 'value' } }, form()),
    ).toThrow();
    expect(() =>
      validateSubmission({ ...input(), answers: { phone: 'abc' } }, form()),
    ).toThrow();
    expect(() =>
      validateSubmission(
        { ...input(), answers: { phone: 'a'.repeat(4001) } },
        form(),
      ),
    ).toThrow();
  });
  it('enforces required conditional paths and hides conditional questions server-side', () => {
    const definition = {
      ...form(),
      questions: [
        {
          id: 'choice',
          type: 'choice' as const,
          label: 'Choose',
          required: true,
          options: ['Yes', 'No'],
        },
        {
          id: 'path',
          type: 'conditional' as const,
          label: 'Location',
          required: true,
          options: [],
          conditional: {
            columns: ['Country', 'City'],
            rows: [
              ['Iraq', 'Erbil'],
              ['USA', 'LA'],
            ],
          },
          condition: { questionId: 'choice', equals: 'Yes' },
        },
      ],
    };
    expect(
      validateSubmission(
        {
          ...input(),
          answers: { choice: 'No', path: 'malicious' },
          phoneCountryCodes: {},
        },
        definition,
      ).answers,
    ).toHaveLength(1);
    expect(() =>
      validateSubmission(
        {
          ...input(),
          answers: { choice: 'Yes', path: '["Iraq",""]' },
          phoneCountryCodes: {},
        },
        definition,
      ),
    ).toThrow();
    expect(() =>
      validateSubmission(
        {
          ...input(),
          answers: { choice: 'Yes', path: '["Iraq","LA"]' },
          phoneCountryCodes: {},
        },
        definition,
      ),
    ).toThrow();
    expect(
      validateSubmission(
        {
          ...input(),
          answers: { choice: 'Yes', path: '["Iraq","Erbil"]' },
          phoneCountryCodes: {},
        },
        definition,
      ).answers,
    ).toHaveLength(2);
  });
  it('rejects non-string and discontinuous optional conditional selections', () => {
    const definition = {
      ...form(),
      questions: [
        {
          id: 'path',
          type: 'conditional' as const,
          label: 'Location',
          required: false,
          options: [],
          conditional: {
            columns: ['Country', 'City'],
            rows: [['Iraq', 'Erbil']],
          },
        },
      ],
    };
    for (const path of ['[0,0]', '["","Erbil"]'])
      expect(() =>
        validateSubmission(
          { ...input(), answers: { path }, phoneCountryCodes: {} },
          definition,
        ),
      ).toThrow();
  });
});
