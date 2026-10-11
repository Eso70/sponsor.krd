import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Subdomain } from '../auth/subdomain.decorator';
import { RedisService } from '../redis/redis.service';
import { requestIp, analyticsRequestContext } from '../common/request-context';
import { FormsService } from './forms.service';
@Controller('api/public/forms')
export class PublicFormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly redis: RedisService,
  ) {}
  private async limit(request: FastifyRequest, kind: string, max: number) {
    if (
      await this.redis.isRateLimited(
        `rl:forms:${kind}:${requestIp(request)}`,
        max,
        60,
      )
    )
      throw new HttpException(
        'Too many requests. Try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }
  @Get(':slug/status') async status(
    @Subdomain() subdomain: string,
    @Param('slug') slug: string,
    @Req() request: FastifyRequest,
  ) {
    await this.limit(request, 'status', 120);
    return {
      success: true,
      data: await this.forms.publicStatus(subdomain, slug),
    };
  }
  @Get(':slug') async read(
    @Subdomain() subdomain: string,
    @Param('slug') slug: string,
    @Req() request: FastifyRequest,
  ) {
    await this.limit(request, 'read', 60);
    return {
      success: true,
      data: await this.forms.publicForm(subdomain, slug),
    };
  }
  @Post(':slug/submissions') async submit(
    @Subdomain() subdomain: string,
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    await this.limit(request, 'submit', 10);
    return {
      success: true,
      data: await this.forms.submit(
        subdomain,
        slug,
        body,
        analyticsRequestContext(request),
      ),
    };
  }
}
