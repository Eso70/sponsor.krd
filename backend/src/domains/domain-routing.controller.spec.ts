import { DomainRoutingController } from './domain-routing.controller';
import { DomainsService } from './domains.service';
import type { FastifyRequest } from 'fastify';
describe('certificate permission endpoint', () => {
  const resolve = jest.fn();
  const controller = new DomainRoutingController({
    resolve,
  } as unknown as DomainsService);
  const request = (address: string) =>
    ({
      raw: { socket: { remoteAddress: address } },
      headers: {},
    }) as unknown as FastifyRequest;
  beforeEach(() => {
    resolve.mockReset();
  });
  it('rejects remote callers before looking up a domain', async () => {
    await expect(
      controller.tls('wafaye.com', request('203.0.113.1')),
    ).rejects.toThrow();
    expect(resolve).not.toHaveBeenCalled();
  });
  it.each(['x-forwarded-for', 'x-forwarded-host', 'x-real-ip'])(
    'rejects edge-forwarded requests carrying %s even on a loopback socket',
    async (name) => {
      const req = request('127.0.0.1');
      req.headers[name] = '203.0.113.1';
      await expect(controller.tls('wafaye.com', req)).rejects.toThrow();
      expect(resolve).not.toHaveBeenCalled();
    },
  );
  it('allows loopback only for an active customer mapping', async () => {
    resolve.mockResolvedValue({ isCustom: true });
    await expect(
      controller.tls('wafaye.com', request('127.0.0.1')),
    ).resolves.toEqual({ success: true });
    resolve.mockResolvedValue(null);
    await expect(
      controller.tls('unknown.com', request('127.0.0.1')),
    ).rejects.toThrow();
    resolve.mockResolvedValue({ isCustom: false });
    await expect(
      controller.tls('wafaye.sponsor.krd', request('127.0.0.1')),
    ).rejects.toThrow();
  });
  it('requires internal proxy authentication for resolution', async () => {
    await expect(
      controller.resolve('wafaye.com', request('127.0.0.1')),
    ).rejects.toThrow();
    expect(resolve).not.toHaveBeenCalled();
  });
});
