import {
  normalizeSponsorKrdAccent,
  SPONSOR_KRD_ACCENT_VALUE,
} from './platform-brand';

describe('normalizeSponsorKrdAccent', () => {
  it.each([undefined, null, '', '#25F4EE', '#25f4ee'])(
    'normalizes a missing or legacy flat default (%s) to the system gradient',
    (value) => {
      expect(normalizeSponsorKrdAccent(value)).toBe(SPONSOR_KRD_ACCENT_VALUE);
    },
  );

  it('preserves an explicitly configured platform gradient', () => {
    expect(normalizeSponsorKrdAccent('gradient:to-br:#111827:#7c3aed')).toBe(
      'gradient:to-br:#111827:#7c3aed',
    );
  });
});
