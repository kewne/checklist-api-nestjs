import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';

export interface SubscriptionDocument {
  endDate: Date;
}

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly firestore: Firestore) {}

  async findByUserId(userId: string): Promise<SubscriptionDocument | null> {
    const snapshot = await this.firestore
      .collection('subscriptions')
      .doc(userId)
      .get();

    if (!snapshot.exists) {
      return null;
    }

    const endDate: unknown = snapshot.data()?.endDate;
    if (endDate instanceof Timestamp) {
      return { endDate: endDate.toDate() };
    }
    throw new Error('Subscription record is invalid');
  }
}
