import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';

export type SubscriptionState =
  | { status: 'ACTIVE'; endDate: Date }
  | { status: 'INACTIVE' };

@Injectable()
export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async getSubscription(userId: string): Promise<SubscriptionState> {
    const subscription = await this.repository.findByUserId(userId);
    const endDate = subscription?.endDate;

    return endDate && endDate.getTime() > Date.now()
      ? { status: 'ACTIVE', endDate }
      : { status: 'INACTIVE' };
  }
}
