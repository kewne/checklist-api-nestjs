import { Ability } from '@app/casl/ability.decorator';
import type { AppAbility } from '@app/casl/ability.factory';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import type { ResourceTypes } from '@app/resource-enrichers';
import { ForbiddenError, subject } from '@casl/ability';
import { Controller, Get, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('users/:userId/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async findOne(
    @Param('userId') userId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    ForbiddenError.from(ability).throwUnlessCan(
      'read',
      subject('UserSubscription', { userId }),
    );

    const state = await this.subscriptionService.getSubscription(userId);

    return linkFactory
      .buildResource('subscription')
      .toResource(
        state.status === 'ACTIVE'
          ? { status: 'ACTIVE', endDate: state.endDate.toISOString() }
          : { status: 'INACTIVE' },
      );
  }
}
