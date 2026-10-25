import {
  inspectPhoneNumber,
  phoneNumberHasAllowedStart,
  normalizePhoneNumber,
} from '@linktree/types/phone-number.cjs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const sharedRequire = createRequire(
  resolve(__dirname, '../../../../packages/types/package.json'),
);
const phoneMetadata = sharedRequire('libphonenumber-js/max') as {
  getCountries(): string[];
  getCountryCallingCode(country: string): string;
  getExampleNumber(
    country: string,
    examples: Record<string, string>,
  ):
    | { number: string; nationalNumber: string; formatNational(): string }
    | undefined;
};
const examples = sharedRequire(
  'libphonenumber-js/examples.mobile.json',
) as Record<string, string>;

describe('shared country phone validation', () => {
  it.each([
    '7501234567',
    '07501234567',
    '+9647501234567',
    '009647501234567',
    '٠٧٥٠١٢٣٤٥٦٧',
  ])('normalizes Iraqi mobile %s', (value) => {
    expect(normalizePhoneNumber(value, '964')).toBe('+9647501234567');
  });
  it.each([
    '750123456',
    '75012345678',
    '0750123456',
    '075012345678',
    '007501234567',
    '6501234567',
    'abc7501234567',
    '750+1234567',
  ])('rejects incorrect Iraqi number %s', (value) => {
    expect(normalizePhoneNumber(value, '964')).toBeNull();
  });
  it.each([
    ['07911123456', '44', '+447911123456'],
    ['0612345678', '39', '+390612345678'],
    ['2133734253', '1', '+12133734253'],
    ['501234567', '971', '+971501234567'],
    ['0501234567', '966', '+966501234567'],
    ['3651234', '1242', '+12423651234'],
  ])(
    'handles country-specific trunk prefixes for %s (+%s)',
    (value, code, expected) => {
      expect(normalizePhoneNumber(value, code)).toBe(expected);
      expect(normalizePhoneNumber(expected + '99', code)).toBeNull();
    },
  );
  it('validates maintained example numbers for every supported geographic region', () => {
    for (const country of phoneMetadata.getCountries()) {
      const sample = phoneMetadata.getExampleNumber(country, examples);
      if (!sample) continue;
      const code = phoneMetadata.getCountryCallingCode(country);
      expect({
        country,
        number: normalizePhoneNumber(sample.number, code),
      }).toEqual({ country, number: sample.number });
      expect({
        country,
        number: normalizePhoneNumber(sample.formatNational(), code),
      }).toEqual({ country, number: sample.number });
    }
  });
  it.each([
    ['3', '246', true],
    ['7', '246', false],
    ['2', '244', true],
    ['9', '244', true],
    ['7', '244', false],
    ['0', '39', true],
    ['8', '7', true],
    ['0', '44', true],
    ['2', '1', true],
    ['0', '1', false],
    ['3', '1242', true],
    ['9', '1242', false],
    ['7', '964', true],
    ['07', '964', true],
    ['06', '964', false],
  ])('checks country entry prefix %s (+%s)', (value, code, allowed) => {
    expect(phoneNumberHasAllowedStart(value, code)).toBe(allowed);
  });
  it('allows every partial prefix of maintained regional example numbers', () => {
    for (const country of phoneMetadata.getCountries()) {
      const sample = phoneMetadata.getExampleNumber(country, examples);
      if (!sample) continue;
      const code = phoneMetadata.getCountryCallingCode(country);
      for (const digits of [
        sample.nationalNumber,
        sample.formatNational().replace(/\D/g, ''),
      ]) {
        for (let length = 0; length <= digits.length; length++) {
          expect({
            country,
            prefix: digits.slice(0, length),
            allowed: phoneNumberHasAllowedStart(digits.slice(0, length), code),
          }).toEqual({
            country,
            prefix: digits.slice(0, length),
            allowed: true,
          });
        }
      }
    }
  });
  it('rejects mismatched countries and reports short/long numbers', () => {
    expect(inspectPhoneNumber('+447911123456', '964').reason).toBe(
      'country_mismatch',
    );
    expect(inspectPhoneNumber('750123456', '964').reason).toBe('too_short');
    expect(inspectPhoneNumber('075012345678', '964').reason).toBe('too_long');
  });
});
