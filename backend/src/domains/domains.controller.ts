import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { AddDomainDto } from './domain.dto';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import type { SessionUser } from '../auth/session.service';

@Controller('api/business/domains')
@UseGuards(BusinessGuard, AuthorizationGuard)
export class BusinessDomainsController {
  constructor(private readonly domains: DomainsService) {}
  @Get()
  @RequireCapabilities(Capability.BusinessDomainsRead)
  async list(@CurrentUser() user: SessionUser) {
    return { success: true, data: await this.domains.list(user.id) };
  }
  @Post()
  @RequireCapabilities(Capability.BusinessDomainsManage)
  async add(@CurrentUser() user: SessionUser, @Body() body: AddDomainDto) {
    return {
      success: true,
      data: await this.domains.add(
        user.id,
        body.hostname,
        user.userId || user.id,
      ),
    };
  }
  @Post(':id/verify')
  @RequireCapabilities(Capability.BusinessDomainsManage)
  async verify(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      success: true,
      data: await this.domains.verify(user.id, id, user.userId || user.id),
    };
  }
  @Post(':id/primary')
  @RequireCapabilities(Capability.BusinessDomainsManage)
  async primary(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      success: true,
      data: await this.domains.primary(user.id, id, user.userId || user.id),
    };
  }
  @Delete(':id')
  @RequireCapabilities(Capability.BusinessDomainsManage)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      success: true,
      data: await this.domains.remove(user.id, id, user.userId || user.id),
    };
  }
}
@Controller('api/platform/businesses/:businessId/domains')
@UseGuards(PlatformAdminGuard, AuthorizationGuard)
export class PlatformBusinessDomainsController {
  constructor(private readonly domains: DomainsService) {}
  @Get()
  @RequireCapabilities(Capability.PlatformBusinessesRead)
  async list(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return { success: true, data: await this.domains.list(businessId) };
  }
  @Post()
  @RequireCapabilities(Capability.PlatformBusinessesUpdate)
  async add(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser() user: SessionUser,
    @Body() body: AddDomainDto,
  ) {
    return {
      success: true,
      data: await this.domains.add(businessId, body.hostname, user.id),
    };
  }
  @Post(':id/verify')
  @RequireCapabilities(Capability.PlatformBusinessesUpdate)
  async verify(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return {
      success: true,
      data: await this.domains.verify(businessId, id, user.id),
    };
  }
  @Post(':id/primary')
  @RequireCapabilities(Capability.PlatformBusinessesUpdate)
  async primary(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return {
      success: true,
      data: await this.domains.primary(businessId, id, user.id),
    };
  }
  @Delete(':id')
  @RequireCapabilities(Capability.PlatformBusinessesUpdate)
  async remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return {
      success: true,
      data: await this.domains.remove(businessId, id, user.id),
    };
  }
}
