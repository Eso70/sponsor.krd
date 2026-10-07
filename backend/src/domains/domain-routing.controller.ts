import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DomainsService } from './domains.service';
import {
  INTERNAL_PROXY_KEY_HEADER,
  isTrustedInternalProxy,
} from '../common/internal-proxy-trust';
@Controller('api/internal/domains')
export class DomainRoutingController {
  constructor(private readonly domains: DomainsService) {}
  @Get('resolve')
  async resolve(@Query('host') host: string, @Req() request: FastifyRequest) {
    if (!isTrustedInternalProxy(request.headers[INTERNAL_PROXY_KEY_HEADER]))
      throw new ForbiddenException();
    return {
      success: true,
      data: await this.domains.resolve(typeof host === 'string' ? host : ''),
    };
  }
  @Get('tls')
  async tls(@Query('domain') domain: string, @Req() request: FastifyRequest) {
    if (
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
        request.raw.socket.remoteAddress || '',
      )
    )
      throw new ForbiddenException();
    const data = await this.domains.resolve(
      typeof domain === 'string' ? domain : '',
    );
    if (!data?.isCustom) throw new NotFoundException();
    return { success: true };
  }
}
