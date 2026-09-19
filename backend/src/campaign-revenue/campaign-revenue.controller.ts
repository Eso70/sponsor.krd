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
import { Capability } from '../auth/capabilities';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { BusinessGuard } from '../auth/business.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequireCapabilities } from '../auth/require-capabilities.decorator';
import type { SessionUser } from '../auth/session.service';
import { CampaignRevenueService } from './campaign-revenue.service';
import { SaveCampaignRevenueDto } from './dto/save-campaign-revenue.dto';

@Controller('api/linktrees/:linktreeId/revenue-records')
@UseGuards(BusinessGuard, AuthorizationGuard)
export class CampaignRevenueController {
  constructor(private readonly revenue: CampaignRevenueService) {}

  @Get()
  @RequireCapabilities(Capability.BusinessLinktreesRead)
  async list(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @CurrentUser() business: SessionUser,
  ) {
    return {
      success: true,
      data: await this.revenue.list(business.id, linktreeId),
    };
  }

  @Post()
  @RequireCapabilities(Capability.BusinessLinktreesUpdate)
  async create(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Body() body: SaveCampaignRevenueDto,
    @CurrentUser() business: SessionUser,
  ) {
    return {
      success: true,
      data: await this.revenue.create(business.id, linktreeId, body),
    };
  }

  @Patch(':recordId')
  @RequireCapabilities(Capability.BusinessLinktreesUpdate)
  async update(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() body: SaveCampaignRevenueDto,
    @CurrentUser() business: SessionUser,
  ) {
    return {
      success: true,
      data: await this.revenue.update(business.id, linktreeId, recordId, body),
    };
  }

  @Delete(':recordId')
  @RequireCapabilities(Capability.BusinessLinktreesUpdate)
  async delete(
    @Param('linktreeId', ParseUUIDPipe) linktreeId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @CurrentUser() business: SessionUser,
  ) {
    await this.revenue.delete(business.id, linktreeId, recordId);
    return { success: true };
  }
}
