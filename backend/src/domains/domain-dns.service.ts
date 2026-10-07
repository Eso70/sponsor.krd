import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resolver } from 'node:dns/promises';
import { ConfigService } from '@nestjs/config';
import { isIP } from 'node:net';

function normalizedAddress(value: string): string {
  return isIP(value) === 6
    ? new URL(`http://[${value}]`).hostname.slice(1, -1)
    : value;
}

@Injectable()
export class DomainDnsService {
  constructor(private readonly config: ConfigService) {}

  addresses(key: 'CUSTOM_DOMAIN_IPV4' | 'CUSTOM_DOMAIN_IPV6'): string[] {
    return (this.config.get<string>(key, '') || '')
      .split(',')
      .map((value) => normalizedAddress(value.trim()))
      .filter(Boolean);
  }

  async check(
    hostname: string,
    token: string,
  ): Promise<'ownership' | 'routing' | null> {
    // Only DNS queries are issued. Never fetch a customer-controlled URL.
    const resolver = new Resolver({ timeout: 2500, tries: 2 });
    async function read<T>(query: Promise<T>, empty: T): Promise<T> {
      try {
        return await query;
      } catch (cause) {
        const code = (cause as NodeJS.ErrnoException).code;
        if (code === 'ENODATA' || code === 'ENOTFOUND') return empty;
        throw new ServiceUnavailableException(
          'DNS verification is temporarily unavailable',
        );
      }
    }
    const txt = await read(
      resolver.resolveTxt(`_sponsor-verification.${hostname}`),
      [] as string[][],
    );
    if (
      !txt.some((parts) => parts.join('') === `sponsor-verification=${token}`)
    )
      return 'ownership';
    const [ipv4, ipv6] = await Promise.all([
      read(resolver.resolve4(hostname), [] as string[]),
      read(resolver.resolve6(hostname), [] as string[]),
    ]);
    const allowed4 = this.addresses('CUSTOM_DOMAIN_IPV4');
    const allowed6 = this.addresses('CUSTOM_DOMAIN_IPV6');
    // Reject mixed routing, including stale AAAA records pointing elsewhere.
    if (
      !(ipv4.length || ipv6.length) ||
      ipv4.some((ip) => !allowed4.includes(ip)) ||
      ipv6.some((ip) => !allowed6.includes(normalizedAddress(ip)))
    )
      return 'routing';
    return null;
  }
}
