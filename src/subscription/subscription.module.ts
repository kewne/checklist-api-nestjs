import { HateoasModule } from '@app/hateoas/hateoas.module';
import { Module } from '@nestjs/common';
import { MySubscriptionController } from './my-subscription.controller';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [HateoasModule],
  controllers: [SubscriptionController, MySubscriptionController],
  providers: [SubscriptionService, SubscriptionRepository],
})
export class SubscriptionModule {}
