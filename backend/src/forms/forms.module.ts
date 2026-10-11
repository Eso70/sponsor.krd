import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PlatformContentWorkspaceModule } from '../platform-workspace/platform-content-workspace.module';
import { FormsService } from './forms.service';
import { BusinessFormsController } from './business-forms.controller';
import { PlatformFormsController } from './platform-forms.controller';
import { PublicFormsController } from './public-forms.controller';
@Module({
  imports: [
    AuthModule,
    StorageModule,
    AnalyticsModule,
    PlatformContentWorkspaceModule,
  ],
  controllers: [
    BusinessFormsController,
    PlatformFormsController,
    PublicFormsController,
  ],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
