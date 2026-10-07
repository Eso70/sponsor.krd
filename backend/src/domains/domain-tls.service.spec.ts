import { EventEmitter } from 'node:events';
import { connect } from 'node:tls';
import { DomainTlsService } from './domain-tls.service';
import { DomainDnsService } from './domain-dns.service';
jest.mock('node:tls', () => ({ connect: jest.fn() }));
describe('HTTPS readiness', () => {
  const dns = {
    addresses: (key: string) =>
      key === 'CUSTOM_DOMAIN_IPV4' ? ['203.0.113.10'] : [],
  };
  const service = new DomainTlsService(dns as unknown as DomainDnsService);
  const connectMock = jest.mocked(connect);
  function socket() {
    return Object.assign(new EventEmitter(), {
      end: jest.fn(),
      destroy: jest.fn(),
    });
  }
  it('checks the public chain and customer hostname only against configured origin IPs', async () => {
    const stream = socket();
    connectMock.mockReturnValue(
      stream as unknown as ReturnType<typeof connect>,
    );
    const ready = service.assertReady('wafaye.com');
    expect(connectMock).toHaveBeenCalledWith({
      host: '203.0.113.10',
      port: 443,
      servername: 'wafaye.com',
      rejectUnauthorized: true,
    });
    stream.emit('secureConnect');
    await ready;
    expect(stream.end).toHaveBeenCalled();
  });
  it('rejects untrusted certificates and network failures', async () => {
    const stream = socket();
    connectMock.mockReturnValue(
      stream as unknown as ReturnType<typeof connect>,
    );
    const ready = service.assertReady('wafaye.com');
    stream.emit('error', new Error('certificate mismatch'));
    await expect(ready).rejects.toThrow('HTTPS is not ready');
    expect(stream.destroy).toHaveBeenCalled();
  });
});
