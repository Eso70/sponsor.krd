import { BadRequestException } from '@nestjs/common';
import { domainToASCII } from 'node:url';
import { isIP } from 'node:net';

/** Domains are hostnames only; never URLs, ports, paths, wildcards or IPs. */
export function normalizeDomain(raw: string, rootDomain: string): string {
  const input = raw.trim().toLowerCase().replace(/\.$/, '');
  if (!input || /[\s/:@?#*\\]/.test(input))
    throw new BadRequestException('Invalid domain');
  const hostname = domainToASCII(input);
  const labels = hostname.split('.');
  const root = rootDomain.toLowerCase().split(':')[0].replace(/\.$/, '');
  if (
    hostname.length > 253 ||
    labels.length < 2 ||
    isIP(hostname) ||
    labels.some(
      (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
    ) ||
    !/^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/.test(labels.at(-1) || '') ||
    /\.(?:localhost|local|internal|test|invalid|example|onion|lan|home)$/.test(
      hostname,
    ) ||
    hostname === root ||
    hostname.endsWith(`.${root}`)
  ) {
    throw new BadRequestException('Invalid domain');
  }
  return hostname;
}
