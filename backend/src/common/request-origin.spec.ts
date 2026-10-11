import {
  isAuthenticatedMutation,
  hasAuthenticatedSessionCookie,
  isSameOriginBrowserRequest,
} from './request-origin';

describe('request origin protection', () => {
  it.each([
    '',
    'https://tenant.example.com/',
    'https://tenant.example.com/path',
    'https://user@tenant.example.com',
    'https://tenant.example.com, https://evil.example',
    'https://tenant.example.com#fragment',
    ['https://tenant.example.com'],
  ])(
    'rejects malformed Origin %s instead of matching a parsed prefix',
    (source) => {
      expect(
        isSameOriginBrowserRequest(
          source,
          'https://tenant.example.com/page',
          'tenant.example.com',
          'https',
          'http',
        ),
      ).toBe(false);
    },
  );
  it('continues accepting a same-origin Referer with a page path', () => {
    expect(
      isSameOriginBrowserRequest(
        undefined,
        'https://tenant.example.com/page?tab=1',
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(true);
  });
  it('recognizes authenticated read cookies independently of method for origin enforcement', () => {
    expect(hasAuthenticatedSessionCookie({ business_session: 'token' })).toBe(
      true,
    );
    expect(hasAuthenticatedSessionCookie({ other: 'token' })).toBe(false);
  });
  it('identifies cookie-authenticated mutations', () => {
    expect(isAuthenticatedMutation('POST', { business_session: 'token' })).toBe(
      true,
    );
    expect(isAuthenticatedMutation('GET', { business_session: 'token' })).toBe(
      false,
    );
    expect(isAuthenticatedMutation('POST', {})).toBe(false);
  });

  it('recognises every session cookie that can authenticate a mutation', () => {
    expect(isAuthenticatedMutation('PATCH', { signup_session: 'token' })).toBe(
      true,
    );
    expect(isAuthenticatedMutation('GET', { signup_session: 'token' })).toBe(
      false,
    );
    expect(isAuthenticatedMutation('PUT', { business_session: 'token' })).toBe(
      true,
    );
    expect(
      isAuthenticatedMutation('DELETE', { platform_admin_session: 'token' }),
    ).toBe(true);
    expect(isAuthenticatedMutation('GET', { business_session: 'token' })).toBe(
      false,
    );
  });

  it('accepts same-origin and server requests', () => {
    expect(
      isSameOriginBrowserRequest(
        'https://tenant.example.com',
        undefined,
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(true);
    expect(
      isSameOriginBrowserRequest(
        undefined,
        undefined,
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(true);
  });

  it('rejects cross-origin, opaque, malformed, or unverifiable origins', () => {
    expect(
      isSameOriginBrowserRequest(
        'https://evil.example',
        undefined,
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(false);
    expect(
      isSameOriginBrowserRequest(
        'null',
        undefined,
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(false);
    expect(
      isSameOriginBrowserRequest(
        'not-a-url',
        undefined,
        'tenant.example.com',
        'https',
        'http',
      ),
    ).toBe(false);
    expect(
      isSameOriginBrowserRequest(
        'https://tenant.example.com',
        undefined,
        undefined,
        'https',
        'http',
      ),
    ).toBe(false);
  });
});
