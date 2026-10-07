import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { connect } from 'node:tls';
import { DomainDnsService } from './domain-dns.service';
@Injectable()
export class DomainTlsService {
  constructor(private readonly dns: DomainDnsService) {}
  async assertReady(hostname: string): Promise<void> {
    const address = [
      ...this.dns.addresses('CUSTOM_DOMAIN_IPV4'),
      ...this.dns.addresses('CUSTOM_DOMAIN_IPV6'),
    ][0];
    if (!address)
      throw new ServiceUnavailableException(
        'Custom-domain server addresses are not configured',
      );
    // Only connect to a configured origin IP; validate the public certificate and SNI hostname.
    await new Promise<void>((resolve, reject) => {
      const socket = connect({
        host: address,
        port: 443,
        servername: hostname,
        rejectUnauthorized: true,
      });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(
          new ServiceUnavailableException(
            'HTTPS is not ready yet. Try again shortly.',
          ),
        );
      }, 10000);
      socket.once('secureConnect', () => {
        clearTimeout(timeout);
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        clearTimeout(timeout);
        socket.destroy();
        reject(
          new ServiceUnavailableException(
            'HTTPS is not ready yet. Try again shortly.',
          ),
        );
      });
    });
  }
}
