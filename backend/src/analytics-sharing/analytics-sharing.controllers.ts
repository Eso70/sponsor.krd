import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { Capability } from '../auth/capabilities';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { requestIp } from '../common/request-context';
import { FormResponsesDto } from '../forms/forms-list.dto';
import { Subdomain } from '../auth/subdomain.decorator';
import { AnalyticsSharingService } from './analytics-sharing.service';
import {
  SharedAnalyticsReportQueryDto,
  CreateAnalyticsShareDto,
  UnlockAnalyticsShareDto,
} from './analytics-sharing.dto';

@Controller('api/forms/:id/analytics-shares')
@UseGuards(BusinessGuard, AuthorizationGuard)
@RequireCapabilities(
  Capability.BusinessFormsRead,
  Capability.BusinessFormsUpdate,
)
export class BusinessFormAnalyticsSharesController {
  constructor(
    private readonly shares: AnalyticsSharingService,
    private readonly workspace: PlatformContentWorkspaceService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { success: true, data: await this.shares.list(user.id, 'form', id) };
  }
  @Post()
  @Header('Cache-Control', 'no-store')
  async create(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.create(user.id, 'form', id, body),
    };
  }
  @Post(':shareId/code')
  @Header('Cache-Control', 'no-store, private')
  async revealCode(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revealCode(user.id, 'form', id, shareId),
    };
  }
  @Post(':shareId/expiry')
  @Header('Cache-Control', 'no-store')
  async expiry(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.updateExpiry(user.id, 'form', id, shareId, body),
    };
  }
  @Post(':shareId/disable')
  @Header('Cache-Control', 'no-store')
  async disable(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(user.id, 'form', id, shareId, false),
    };
  }
  @Delete(':shareId')
  @Header('Cache-Control', 'no-store')
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(user.id, 'form', id, shareId, true),
    };
  }
}

@Controller('api/linktrees/:id/analytics-shares')
@UseGuards(BusinessGuard, AuthorizationGuard)
@RequireCapabilities(
  Capability.BusinessLinktreesRead,
  Capability.BusinessLinktreesUpdate,
)
export class BusinessLinktreeAnalyticsSharesController {
  constructor(
    private readonly shares: AnalyticsSharingService,
    private readonly workspace: PlatformContentWorkspaceService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      success: true,
      data: await this.shares.list(user.id, 'linktree', id),
    };
  }
  @Post()
  @Header('Cache-Control', 'no-store')
  async create(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.create(user.id, 'linktree', id, body),
    };
  }
  @Post(':shareId/code')
  @Header('Cache-Control', 'no-store, private')
  async revealCode(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revealCode(user.id, 'linktree', id, shareId),
    };
  }
  @Post(':shareId/expiry')
  @Header('Cache-Control', 'no-store')
  async expiry(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.updateExpiry(
        user.id,
        'linktree',
        id,
        shareId,
        body,
      ),
    };
  }
  @Post(':shareId/disable')
  @Header('Cache-Control', 'no-store')
  async disable(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(user.id, 'linktree', id, shareId, false),
    };
  }
  @Delete(':shareId')
  @Header('Cache-Control', 'no-store')
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(user.id, 'linktree', id, shareId, true),
    };
  }
}

@Controller('api/platform/forms/:id/analytics-shares')
@UseGuards(PlatformAdminGuard, AuthorizationGuard)
@RequireCapabilities(
  Capability.PlatformFormsRead,
  Capability.PlatformFormsUpdate,
)
export class PlatformFormAnalyticsSharesController {
  constructor(
    private readonly shares: AnalyticsSharingService,
    private readonly workspace: PlatformContentWorkspaceService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.shares.list(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
      ),
    };
  }
  @Post()
  @Header('Cache-Control', 'no-store')
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.create(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
        body,
      ),
    };
  }
  @Post(':shareId/code')
  @Header('Cache-Control', 'no-store, private')
  async revealCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revealCode(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
        shareId,
      ),
    };
  }
  @Post(':shareId/expiry')
  @Header('Cache-Control', 'no-store')
  async expiry(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.updateExpiry(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
        shareId,
        body,
      ),
    };
  }
  @Post(':shareId/disable')
  @Header('Cache-Control', 'no-store')
  async disable(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
        shareId,
        false,
      ),
    };
  }
  @Delete(':shareId')
  @Header('Cache-Control', 'no-store')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(
        await this.workspace.getWorkspaceId(),
        'form',
        id,
        shareId,
        true,
      ),
    };
  }
}

@Controller('api/platform/linktrees/:id/analytics-shares')
@UseGuards(PlatformAdminGuard, AuthorizationGuard)
@RequireCapabilities(
  Capability.PlatformLinktreesRead,
  Capability.PlatformLinktreesUpdate,
)
export class PlatformLinktreeAnalyticsSharesController {
  constructor(
    private readonly shares: AnalyticsSharingService,
    private readonly workspace: PlatformContentWorkspaceService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: await this.shares.list(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
      ),
    };
  }
  @Post()
  @Header('Cache-Control', 'no-store')
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.create(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
        body,
      ),
    };
  }
  @Post(':shareId/code')
  @Header('Cache-Control', 'no-store, private')
  async revealCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revealCode(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
        shareId,
      ),
    };
  }
  @Post(':shareId/expiry')
  @Header('Cache-Control', 'no-store')
  async expiry(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() body: CreateAnalyticsShareDto,
  ) {
    return {
      success: true,
      data: await this.shares.updateExpiry(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
        shareId,
        body,
      ),
    };
  }
  @Post(':shareId/disable')
  @Header('Cache-Control', 'no-store')
  async disable(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
        shareId,
        false,
      ),
    };
  }
  @Delete(':shareId')
  @Header('Cache-Control', 'no-store')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return {
      success: true,
      data: await this.shares.revoke(
        await this.workspace.getWorkspaceId(),
        'linktree',
        id,
        shareId,
        true,
      ),
    };
  }
}

@Controller('api/public/analytics-shares')
export class PublicAnalyticsSharesController {
  constructor(private readonly shares: AnalyticsSharingService) {}
  @Get(':id/branding')
  @Header('Cache-Control', 'no-store, private')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async branding(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: FastifyRequest,
    @Subdomain() subdomain: string,
  ) {
    return {
      success: true,
      data: await this.shares.branding(id, requestIp(request), subdomain),
    };
  }
  @Get(':id/responses')
  @Header('Cache-Control', 'no-store, private')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async responses(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: FastifyRequest,
    @Query() query: FormResponsesDto,
    @Subdomain() subdomain: string,
  ) {
    return {
      success: true,
      data: await this.shares.responses(
        id,
        request.cookies?.analytics_share_session,
        requestIp(request),
        Number(query.page),
        query.filters(),
        subdomain,
      ),
    };
  }
  @Post(':id/unlock')
  @Header('Cache-Control', 'no-store, private')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UnlockAnalyticsShareDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Subdomain() subdomain: string,
  ) {
    const session = await this.shares.unlock(
      id,
      body.code,
      requestIp(request),
      subdomain,
    );
    reply.setCookie('analytics_share_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: `/api/public/analytics-shares/${id}`,
      maxAge: session.ttl,
    });
    return { success: true, data: { unlocked: true } };
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store, private')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: FastifyRequest,
    @Query() query: SharedAnalyticsReportQueryDto,
    @Subdomain() subdomain: string,
  ) {
    return {
      success: true,
      data: await this.shares.report(
        id,
        request.cookies?.analytics_share_session,
        requestIp(request),
        Number(query.responsePage ?? 0),
        subdomain,
        { from: query.from, to: query.to },
      ),
    };
  }
}
