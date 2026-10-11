import { Controller, Get, UseGuards } from '@nestjs/common';
import { BusinessGuard } from '../auth/business.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PublicService } from '../public/public.service';

/** Billing remains readable for authenticated tenants whose paid access expired. */
@Controller('api/billing/subscription')
@UseGuards(BusinessGuard)
export class CustomerSubscriptionsController {
  constructor(
    private readonly publicService: PublicService,
    private readonly authorization: AuthorizationService,
  ) {}

  @Get()
  async overview(@CurrentUser() user: SessionUser) {
    const [plans, access] = await Promise.all([
      this.publicService.getPlans(),
      this.authorization.getEffectiveAccess(user.id),
    ]);
    return { success: true, data: { plans, access } };
  }
}
