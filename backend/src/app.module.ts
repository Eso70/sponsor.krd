import { AnalyticsSharingModule } from './analytics-sharing/analytics-sharing.module';
import { FormsModule } from './forms/forms.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CustomerSubscriptionsModule } from './billing/customer-subscriptions.module';
import { DomainsModule } from './domains/domains.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LinktreesModule } from './linktrees/linktrees.module';
import { LinksModule } from './links/links.module';
import { PublicModule } from './public/public.module';
import { StorageModule } from './storage/storage.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommunicationModule } from './communications/communication.module';

import { ObservabilityModule } from './observability/observability.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    FormsModule,
    AnalyticsSharingModule,
    ConfigModule,
    DatabaseModule,
    RedisModule,
    ObservabilityModule,
    CommunicationModule,
    AuthModule,
    DomainsModule,
    AnalyticsModule,
    LinktreesModule,

    LinksModule,
    PublicModule,
    CustomerSubscriptionsModule,
    StorageModule,
    PlatformAdminModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
