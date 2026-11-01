import type { FastifyRequest } from 'fastify';
import { analyticsRequestContext, requestCookie } from './request-context';

describe('optional public tracking cookies', () => {
  const request = (cookie: string) =>
    ({
      headers: { cookie, 'user-agent': 'test browser' },
      ip: '127.0.0.1',
    }) as FastifyRequest;
  it.each(['_ttp=%E0%A4%A', '_ttp=%', '_ttp=%GG', 'other=value'])(
    'ignores missing or malformed metadata: %s',
    (cookie) => {
      expect(requestCookie(request(cookie), '_ttp')).toBeUndefined();
      expect(analyticsRequestContext(request(cookie))).toMatchObject({
        ip: '127.0.0.1',
        userAgent: 'test browser',
        ttp: undefined,
      });
    },
  );
  it('keeps valid attribution without confusing similarly named cookies', () => {
    expect(
      requestCookie(
        request('not_ttp=wrong; _ttp=valid%20value; other=123'),
        '_ttp',
      ),
    ).toBe('valid value');
  });
});
