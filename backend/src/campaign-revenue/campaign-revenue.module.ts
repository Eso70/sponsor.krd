import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformContentWorkspaceModule } from '../platform-workspace/platform-content-workspace.module';
import { CampaignRevenueController } from './campaign-revenue.controller';
import { CampaignRevenueService } from './campaign-revenue.service';
import { PlatformCampaignRevenueController } from './platform-campaign-revenue.controller';

@Module({
  imports: [AuthModule, PlatformContentWorkspaceModule],
  controllers: [CampaignRevenueController, PlatformCampaignRevenueController],
  providers: [CampaignRevenueService],
})
export class CampaignRevenueModule {}
