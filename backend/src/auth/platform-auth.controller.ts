import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Body,
} from '@nestjs/common';
import { SessionService } from './session.service';
import type { SessionUser } from './session.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { CurrentUser } from './current-user.decorator';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { PlatformLocaleService } from './platform-locale.service';
import { UpdatePlatformPreferredLocaleDto } from './dto/update-platform-preferred-locale.dto';

@Controller('api/platform/auth')
export class PlatformAuthController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly platformLocaleService: PlatformLocaleService,
  ) {}

  @Get('profile')
  @UseGuards(PlatformAdminGuard)
  async getProfile(@CurrentUser() user: SessionUser) {
    const preferredLocale = await this.platformLocaleService.getPreferredLocale(
      user.id,
    );
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email || null,
        preferred_locale: preferredLocale,
      },
    };
  }

  @Patch('preferred-locale')
  @UseGuards(PlatformAdminGuard)
  async updatePreferredLocale(
    @CurrentUser() user: SessionUser,
    @Body() body: UpdatePlatformPreferredLocaleDto,
  ) {
    const locale = await this.platformLocaleService.updatePreferredLocale(
      user.id,
      body.locale,
    );
    return { locale };
  }

  @Get('effective-access')
  @UseGuards(PlatformAdminGuard)
  getEffectiveAccess() {
    return { success: true, data: { unrestricted: true } };
  }

  @Post('logout')
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: FastifyRequest & { sessionToken?: string },
    @Res({ passthrough: true }) res: FastifyReply,
    @CurrentUser() user: SessionUser,
  ) {
    const sessionToken = req.sessionToken;
    if (sessionToken && user) {
      await this.sessionService.destroySession(sessionToken, user);
    }

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim();
    const requestIsHttps =
      forwardedProto === 'https' || req.protocol === 'https';

    res.setCookie('platform_admin_session', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: requestIsHttps,
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}
