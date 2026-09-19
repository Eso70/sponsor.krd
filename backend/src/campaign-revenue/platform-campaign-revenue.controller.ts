import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { Capability } from '../auth/capabilities';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import { PlatformContentWorkspaceService } from '../platform-workspace/platform-content-workspace.service';
import { CampaignRevenueService } from './campaign-revenue.service';
import { SaveCampaignRevenueDto } from './dto/save-campaign-revenue.dto';

@Controller('api/platform/linktrees/:linktreeId/revenue-records')
@UseGuards(PlatformAdminGuard, AuthorizationGuard)
export class PlatformCampaignRevenueController {
  constructor(
    private readonly revenue: CampaignRevenueService,
    private readonly workspace: PlatformContentWorkspaceService,
  ) {}

  private async businessId() {
    return this.workspace.getWorkspaceId();
  }

  @Get()
  @RequireCapabilities(Capability.PlatformLinktreesRead)
  async list(@Param('linktreeId', ParseUUIDPipe) linktreeId: string) {
    return {
      success: true,
      data: await this.revenue.list(await this.businessId(), linktreeId),
    };
  }

  @Post()
  @RequireCapabilities(Capability.PlatformLinktreesUpdate)
  async create(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Body() body: SaveCampaignRevenueDto,
  ) {
    return {
      success: true,
      data: await this.revenue.create(
        await this.businessId(),
        linktreeId,
        body,
      ),
    };
  }

  @Patch(':recordId')
  @RequireCapabilities(Capability.PlatformLinktreesUpdate)
  async update(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() body: SaveCampaignRevenueDto,
  ) {
    return {
      success: true,
      data: await this.revenue.update(
        await this.businessId(),
        linktreeId,
        recordId,
        body,
      ),
    };
  }

  @Delete(':recordId')
  @RequireCapabilities(Capability.PlatformLinktreesUpdate)
  async delete(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
  ) {
    await this.revenue.delete(await this.businessId(), linktreeId, recordId);
    return { success: true };
  }
}
