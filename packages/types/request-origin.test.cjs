const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SESSION_COOKIE_NAMES, isSafeRequestMethod, browserOrigin, isSameOriginSource } = require('./request-origin.cjs');

test('one shared authenticated cookie catalog and safe method rule', () => {
  assert.deepEqual(SESSION_COOKIE_NAMES, ['business_session', 'platform_admin_session', 'signup_session']);
  for (const method of ['GET', 'HEAD', 'options']) assert.equal(isSafeRequestMethod(method), true);
  assert.equal(isSafeRequestMethod('POST'), false);
  assert.equal(Object.isFrozen(SESSION_COOKIE_NAMES), true);
});

test('strict origins distinguish tenant, scheme and port and reject forged syntax', () => {
  const expected = browserOrigin('tenant.example:3011', 'https');
  assert.equal(isSameOriginSource('https://tenant.example:3011', null, expected), true);
  assert.equal(isSameOriginSource(null, 'https://tenant.example:3011/page', expected), true);
  assert.equal(isSameOriginSource(null, null, expected), true);
  for (const source of ['null', 'https://other.example:3011', 'http://tenant.example:3011', 'https://tenant.example',
    'https://tenant.example:3011/', 'https://user:password@tenant.example:3011', ['https://tenant.example:3011']]) {
    assert.equal(isSameOriginSource(source, null, expected), false);
  }
  assert.equal(browserOrigin('tenant.example/path', 'https'), null);
  assert.equal(browserOrigin('tenant.example', 'ftp'), null);
});
