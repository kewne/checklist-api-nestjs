import { Firestore, Timestamp } from '@google-cloud/firestore';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { FirestoreModule } from '../firestore.module';
import { SubscriptionRepository } from './subscription.repository';

describe('SubscriptionRepository', () => {
  let module: TestingModule;
  let firestore: Firestore;
  let repository: SubscriptionRepository;
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), FirestoreModule],
      providers: [SubscriptionRepository],
    }).compile();
    firestore = module.get(Firestore);
    repository = module.get(SubscriptionRepository);
  });

  beforeEach(() => {
    userId = randomUUID();
    otherUserId = randomUUID();
  });

  afterEach(async () => {
    const batch = firestore.batch();
    batch.delete(firestore.collection('subscriptions').doc(userId));
    batch.delete(firestore.collection('subscriptions').doc(otherUserId));
    await batch.commit();
  });

  afterAll(async () => {
    await firestore.terminate();
    await module.close();
  });

  describe('findByUserId', () => {
    it('reads only the requested user document and converts its end date', async () => {
      const endDate = new Date('2027-01-01T00:00:00Z');
      await firestore
        .collection('subscriptions')
        .doc(userId)
        .set({
          endDate: Timestamp.fromDate(endDate),
        });
      await firestore
        .collection('subscriptions')
        .doc(otherUserId)
        .set({
          endDate: Timestamp.fromDate(new Date('2028-01-01T00:00:00Z')),
        });

      await expect(repository.findByUserId(userId)).resolves.toEqual({
        endDate,
      });
    });

    it('returns null only when the document does not exist', async () => {
      await expect(repository.findByUserId(userId)).resolves.toBeNull();
    });

    it('reads a date stored as a Firestore timestamp', async () => {
      const endDate = new Date('2027-01-01T00:00:00Z');
      await firestore.collection('subscriptions').doc(userId).set({ endDate });

      await expect(repository.findByUserId(userId)).resolves.toEqual({
        endDate,
      });
    });
  });
});
