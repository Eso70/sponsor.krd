import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { DomainsService } from './domains.service';
import { publicSubdomainFromHost } from '../common/root-domain';
import {
  INTERNAL_PROXY_KEY_HEADER,
  isTrustedInternalProxy,
} from '../common/internal-proxy-trust';
export type DomainRequest = FastifyRequest & { customDomainSubdomain?: string };
@Injectable()
export class CustomDomainGuard implements CanActivate {
  constructor(
    private readonly domains: DomainsService,
    private readonly config: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DomainRequest>();
    const host = String(request.headers.host || '');
    if (
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
        request.raw.socket.remoteAddress || '',
      ) &&
      /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)
    )
      return true;
    const subdomain = publicSubdomainFromHost(
      host,
      this.config.get<string>('ROOT_DOMAIN', 'localhost'),
    );
    if (subdomain === '') return true;
    if (
      isTrustedInternalProxy(request.headers[INTERNAL_PROXY_KEY_HEADER]) &&
      /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)
    )
      return true;
    // Match the registered route, so encoded path spellings cannot bypass
    // the platform/internal boundary before Fastify decodes parameters.
    let path: string;
    try {
      path =
        request.routeOptions?.url ||
        new URL(decodeURIComponent(request.url), 'http://localhost').pathname;
    } catch {
      throw new NotFoundException();
    }
    if (
      /^\/api\/(?:platform|signup|internal)(?:\/|$)/.test(path) ||
      path === '/api/auth/google/callback'
    )
      throw new NotFoundException();
    const resolved = await this.domains.resolve(host);
    if (subdomain !== null) {
      if (resolved?.primaryHostname) throw new NotFoundException();
      return true;
    }
    if (!resolved?.isCustom || resolved.primaryHostname !== resolved.hostname)
      throw new NotFoundException();
    request.customDomainSubdomain = resolved.subdomain;
    return true;
  }
}
