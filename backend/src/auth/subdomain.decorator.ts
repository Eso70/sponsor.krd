import {
  createParamDecorator,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { publicSubdomainFromHost } from '../common/root-domain';

import type { FastifyRequest } from 'fastify';
import type { DomainRequest } from '../domains/custom-domain.guard';
import {
  INTERNAL_PROXY_KEY_HEADER,
  isTrustedInternalProxy,
} from '../common/internal-proxy-trust';

export const Subdomain = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    if ((request as DomainRequest).customDomainSubdomain)
      return (request as DomainRequest).customDomainSubdomain;

    // The x-subdomain header is only authoritative when it came from a
    // verified internal proxy call — see internal-proxy-trust.ts. An
    // external caller that reaches this process directly cannot set it and
    // falls through to Host-header parsing below.
    if (isTrustedInternalProxy(request.headers?.[INTERNAL_PROXY_KEY_HEADER])) {
      const headerValue = request.headers?.['x-subdomain'];
      const xSubdomain = Array.isArray(headerValue)
        ? headerValue[0]
        : headerValue;
      if (typeof xSubdomain === 'string') {
        const normalized = xSubdomain.trim().toLowerCase();
        if (!normalized) return '';
        if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
          return normalized === 'www' ? '' : normalized;
        }
        throw new NotFoundException('Not Found');
      }
    }

    // Fallback: parse host header
    const hostValue = request.headers?.['host'] || '';
    const rawHost: string = String(
      Array.isArray(hostValue) ? hostValue[0] : hostValue,
    );
    const subdomain = publicSubdomainFromHost(
      rawHost,
      process.env.ROOT_DOMAIN || 'localhost',
    );
    if (subdomain !== null) return subdomain;
    throw new NotFoundException('Not Found');
  },
);
