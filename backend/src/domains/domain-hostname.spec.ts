import { normalizeDomain } from './domain-hostname';
describe('custom domain validation', () => {
  it('normalizes case, trailing dot and IDN hostnames', () => {
    expect(normalizeDomain(' WAFAYE.com. ', 'sponsor.krd')).toBe('wafaye.com');
    expect(normalizeDomain('bücher.de', 'sponsor.krd')).toBe(
      'xn--bcher-kva.de',
    );
    expect(normalizeDomain('www.wafaye.com', 'sponsor.krd')).toBe(
      'www.wafaye.com',
    );
  });
  it.each([
    'https://wafaye.com',
    'wafaye.com/path',
    'wafaye.com:443',
    '*.wafaye.com',
    'user@wafaye.com',
    '127.0.0.1',
    'localhost',
    'a.local',
    'a.internal',
    'a.test',
    'sponsor.krd',
    'www.sponsor.krd',
    'a.sponsor.krd',
    'a..com',
    '-a.com',
    'a-.com',
    'a'.repeat(64) + '.com',
  ])('rejects %s', (host) => {
    expect(() => normalizeDomain(host, 'sponsor.krd')).toThrow();
  });
});
