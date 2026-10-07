import { Module } from '@nestjs/common';
import { SubdomainPolicyService } from './subdomain-policy.service';

@Module({
  providers: [SubdomainPolicyService],
  exports: [SubdomainPolicyService],
})
export class SubdomainsModule {}
