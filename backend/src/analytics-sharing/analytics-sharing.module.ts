import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FormsModule } from '../forms/forms.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PlatformContentWorkspaceModule } from '../platform-workspace/platform-content-workspace.module';
import { AnalyticsSharingService } from './analytics-sharing.service';
import {
  BusinessFormAnalyticsSharesController,
  BusinessLinktreeAnalyticsSharesController,
  PlatformFormAnalyticsSharesController,
  PlatformLinktreeAnalyticsSharesController,
  PublicAnalyticsSharesController,
} from './analytics-sharing.controllers';
@Module({
  imports: [
    AuthModule,
    AnalyticsModule,
    PlatformContentWorkspaceModule,
    FormsModule,
  ],
  controllers: [
    BusinessFormAnalyticsSharesController,
    BusinessLinktreeAnalyticsSharesController,
    PlatformFormAnalyticsSharesController,
    PlatformLinktreeAnalyticsSharesController,
    PublicAnalyticsSharesController,
  ],
  providers: [AnalyticsSharingService],
})
export class AnalyticsSharingModule {}
