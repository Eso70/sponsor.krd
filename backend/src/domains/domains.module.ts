import { Module, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { DomainsService } from './domains.service';
import { DomainDnsService } from './domain-dns.service';
import { DomainTlsService } from './domain-tls.service';
import {
  BusinessDomainsController,
  PlatformBusinessDomainsController,
} from './domains.controller';
import { DomainRoutingController } from './domain-routing.controller';
import { CustomDomainGuard } from './custom-domain.guard';
@Module({
  imports: [AuthModule],
  controllers: [
    BusinessDomainsController,
    PlatformBusinessDomainsController,
    DomainRoutingController,
  ],
  providers: [
    DomainsService,
    DomainDnsService,
    DomainTlsService,
    { provide: APP_GUARD, useClass: CustomDomainGuard },
  ],
  exports: [DomainsService],
})
export class DomainsModule implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(DomainsModule.name);
  constructor(private readonly domains: DomainsService) {}
  onModuleInit() {
    this.timer = setInterval(() => {
      void this.domains
        .recheck()
        .catch((error: unknown) =>
          this.logger.error('Custom-domain maintenance failed', error),
        );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
