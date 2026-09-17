import {
  Controller,
  Get,
  Param,
  Req,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { RedisService } from '../redis/redis.service';
import { Subdomain } from '../auth/subdomain.decorator';
import type { FastifyRequest } from 'fastify';
import { requestIp } from '../common/request-context';

@Controller('api/public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly redisService: RedisService,
  ) {}

  private async enforcePublicPageRequest(
    uid: string,
    req: FastifyRequest,
  ): Promise<void> {
    if (!/^[a-z0-9-]+$/.test(uid) || uid.length > 50) {
      throw new HttpException('Invalid linktree ID', HttpStatus.BAD_REQUEST);
    }

    const clientIp = requestIp(req);
    const isLimited = await this.redisService.isRateLimited(
      `rl:public:${clientIp}`,
      30,
      60,
    );
    if (isLimited) {
      throw new HttpException(
        { message: 'Too many requests', retryAfter: 60 },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  @Get('business')
  async getBusiness(@Subdomain() subdomain: string) {
    if (!subdomain) {
      throw new NotFoundException('Not Found');
    }
    const business = await this.publicService.getBusinessBySubdomain(subdomain);
    return { success: true, data: business };
  }

  @Get('linktrees')
  async getLinktrees(@Subdomain() subdomain: string) {
    if (!subdomain) {
      throw new NotFoundException('Not Found');
    }

    const linktrees =
      await this.publicService.getLinktreesBySubdomain(subdomain);
    return { success: true, data: linktrees };
  }

  @Get('plans')
  async getPlans() {
    return { success: true, data: await this.publicService.getPlans() };
  }

  @Get('platform-theme')
  async getPlatformTheme() {
    return {
      success: true,
      data: await this.publicService.getPlatformTheme(),
    };
  }

  @Get('tracking/:routeKey')
  async getPublicRouteTracking(
    @Param('routeKey') routeKey: string,
    @Subdomain() subdomain: string,
  ) {
    if (!/^[a-z0-9-]{2,50}$/.test(routeKey)) {
      throw new NotFoundException('Not Found');
    }
    return {
      success: true,
      data: await this.publicService.getPublicRouteTracking(
        routeKey,
        subdomain && subdomain !== 'www' ? subdomain : undefined,
      ),
    };
  }

  @Get('linktree/:uid')
  async getPublicPage(
    @Param('uid') uid: string,
    @Subdomain() subdomain: string,
    @Req() req: FastifyRequest,
  ) {
    // Reject requests from root domain (no subdomain)
    if (!subdomain || subdomain === 'id') {
      throw new NotFoundException('Not Found');
    }

    await this.enforcePublicPageRequest(uid, req);

    // Fetch linktree scoped to the subdomain's business
    const data = await this.publicService.getPublicLinktreeByUidAndSubdomain(
      uid,
      subdomain,
    );
    return { success: true, data };
  }

  @Get('platform/linktree/:uid')
  async getPlatformPublicPage(
    @Param('uid') uid: string,
    @Subdomain() subdomain: string,
    @Req() req: FastifyRequest,
  ) {
    // This endpoint is intentionally root-only. A platform page must never be
    // confused with a tenant-owned page on a business subdomain.
    if (subdomain && subdomain !== 'www') {
      throw new NotFoundException('Not Found');
    }
    await this.enforcePublicPageRequest(uid, req);
    return {
      success: true,
      data: await this.publicService.getPlatformPublicLinktree(uid),
    };
  }
}
