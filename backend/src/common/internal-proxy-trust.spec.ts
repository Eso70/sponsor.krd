import {
  isTrustedInternalProxy,
  restoreTrustedProxyHost,
  INTERNAL_PROXY_HOST_HEADER,
  INTERNAL_PROXY_KEY_HEADER,
} from './internal-proxy-trust';
import type { IncomingHttpHeaders } from 'http';

describe('isTrustedInternalProxy', () => {
  it('restores the browser hostname and port only for authenticated metadata', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    const headers: IncomingHttpHeaders = {
      host: '127.0.0.1:4000',
      [INTERNAL_PROXY_HOST_HEADER]: 'lvh.me:3011',
      [INTERNAL_PROXY_KEY_HEADER]: 'a'.repeat(32),
    };
    expect(restoreTrustedProxyHost({ headers })).toBe(true);
    expect(headers.host).toBe('lvh.me:3011');
  });

  it.each([undefined, 'wrong-key', ['a'.repeat(32)]])(
    'ignores browser-supplied host metadata with key %s',
    (key) => {
      process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
      const headers: IncomingHttpHeaders = {
        host: '127.0.0.1:4000',
        [INTERNAL_PROXY_HOST_HEADER]: 'victim.sponsor.krd',
        [INTERNAL_PROXY_KEY_HEADER]: key,
      };
      restoreTrustedProxyHost({ headers });
      expect(headers.host).toBe('127.0.0.1:4000');
    },
  );

  it.each([
    'https://lvh.me',
    'lvh.me/path',
    'lvh.me:99999',
    'lvh.me,evil.com',
    'user@lvh.me',
    ['lvh.me'],
    '',
    '.lvh.me',
    'lvh..me',
    '-lvh.me',
  ])('rejects malformed trusted host %s', (host) => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    const headers: IncomingHttpHeaders = {
      host: '127.0.0.1:4000',
      [INTERNAL_PROXY_HOST_HEADER]: host,
      [INTERNAL_PROXY_KEY_HEADER]: 'a'.repeat(32),
    };
    expect(restoreTrustedProxyHost({ headers })).toBe(false);
    expect(headers.host).toBe('127.0.0.1:4000');
  });

  const ORIGINAL_SESSION_SECRET = process.env.SESSION_SECRET;
  const ORIGINAL_INTERNAL_PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET;

  afterEach(() => {
    if (ORIGINAL_SESSION_SECRET === undefined)
      delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = ORIGINAL_SESSION_SECRET;
    if (ORIGINAL_INTERNAL_PROXY_SECRET === undefined)
      delete process.env.INTERNAL_PROXY_SECRET;
    else process.env.INTERNAL_PROXY_SECRET = ORIGINAL_INTERNAL_PROXY_SECRET;
  });

  it('keeps legacy internal calls without host metadata working', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    const headers = {
      host: '127.0.0.1:4000',
      [INTERNAL_PROXY_KEY_HEADER]: 'a'.repeat(32),
    };
    expect(restoreTrustedProxyHost({ headers })).toBe(true);
    expect(headers.host).toBe('127.0.0.1:4000');
  });

  it('trusts a matching INTERNAL_PROXY_SECRET', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    process.env.SESSION_SECRET = 'b'.repeat(32);
    expect(isTrustedInternalProxy('a'.repeat(32))).toBe(true);
  });

  it('falls back to SESSION_SECRET when INTERNAL_PROXY_SECRET is unset', () => {
    delete process.env.INTERNAL_PROXY_SECRET;
    process.env.SESSION_SECRET = 'b'.repeat(32);
    expect(isTrustedInternalProxy('b'.repeat(32))).toBe(true);
  });

  it('rejects a wrong key', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    expect(isTrustedInternalProxy('wrong-key')).toBe(false);
  });

  it('rejects a missing key', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    expect(isTrustedInternalProxy(undefined)).toBe(false);
  });

  it('rejects when neither secret is configured', () => {
    delete process.env.INTERNAL_PROXY_SECRET;
    delete process.env.SESSION_SECRET;
    expect(isTrustedInternalProxy('anything')).toBe(false);
  });

  it('rejects a non-string header value', () => {
    process.env.INTERNAL_PROXY_SECRET = 'a'.repeat(32);
    expect(isTrustedInternalProxy(['a'.repeat(32)])).toBe(false);
  });
});
