import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { StorageService } from '../storage/storage.service';
import { imageToIco } from '../storage/favicon';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { RedisService } from '../redis/redis.service';
import { requestIp } from '../common/request-context';

@Controller('api/public')
export class PublicBrandingController {
  private readonly icons = new Map<
    string,
    { bytes: Buffer; etag: string; expires: number }
  >();
  constructor(
    private readonly storage: StorageService,
    private readonly workspace: PlatformContentWorkspaceService,
    private readonly redis: RedisService,
  ) {}

  @Get('platform-branding')
  async branding() {
    return { success: true, data: await this.workspace.getBranding() };
  }

  /** Only already-public uploaded assets, never remote URLs or private file paths. */
  @Get('brand-icon')
  async icon(
    @Query('asset') asset: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (
      typeof asset !== 'string' ||
      asset.length > 500 ||
      !/^\/images\/upload\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|ico)$/i.test(asset) ||
      asset.includes('..')
    )
      throw new NotFoundException();
    if (
      await this.redis.isRateLimited(
        `rl:brand-icon:${requestIp(request)}`,
        120,
        60,
      )
    )
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    let icon = this.icons.get(asset);
    if (!icon || icon.expires < Date.now()) {
      const source = await this.storage.readUploadedAsset(asset);
      if (!source) throw new NotFoundException();
      try {
        const bytes = await imageToIco(source);
        icon = {
          bytes,
          etag: `"${createHash('sha256').update(bytes).digest('hex')}"`,
          expires: Date.now() + 300_000,
        };
      } catch {
        throw new NotFoundException();
      }
      if (this.icons.size >= 128)
        this.icons.delete(this.icons.keys().next().value!);
      this.icons.set(asset, icon);
    }
    reply
      .header('Content-Type', 'image/x-icon')
      .header('Cache-Control', 'public, max-age=300')
      .header('ETag', icon.etag)
      .header('X-Content-Type-Options', 'nosniff');
    if (request.headers['if-none-match'] === icon.etag)
      return reply.code(304).send();
    return reply.send(icon.bytes);
  }
}
