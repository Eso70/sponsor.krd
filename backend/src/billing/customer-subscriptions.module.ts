import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicModule } from '../public/public.module';
import { CustomerSubscriptionsController } from './customer-subscriptions.controller';

@Module({
  imports: [AuthModule, PublicModule],
  controllers: [CustomerSubscriptionsController],
})
export class CustomerSubscriptionsModule {}
