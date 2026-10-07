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
    if (
      publicSubdomainFromHost(
        host,
        this.config.get<string>('ROOT_DOMAIN', 'localhost'),
      ) !== null
    )
      return true;
    if (isTrustedInternalProxy(request.headers[INTERNAL_PROXY_KEY_HEADER]))
      return true;
    const resolved = await this.domains.resolve(host);
    if (!resolved?.isCustom) throw new NotFoundException();
    const path = request.url.split('?')[0];
    if (!/^\/api\/public(?:\/|$)/.test(path)) throw new NotFoundException();
    request.customDomainSubdomain = resolved.subdomain;
    return true;
  }
}
