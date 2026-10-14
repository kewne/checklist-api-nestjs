import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  let repository: jest.Mocked<Pick<SubscriptionRepository, 'findByUserId'>>;
  let service: SubscriptionService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    repository = { findByUserId: jest.fn() };
    service = new SubscriptionService(repository as SubscriptionRepository);
  });

  afterEach(() => jest.useRealTimers());

  describe('getSubscription', () => {
    it('reports a subscription ending in the future as active', async () => {
      const endDate = new Date(now.getTime() + 1);
      repository.findByUserId.mockResolvedValue({ endDate });

      await expect(service.getSubscription('user-1')).resolves.toEqual({
        status: 'ACTIVE',
        endDate,
      });
      expect(repository.findByUserId).toHaveBeenCalledTimes(1);
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('reports a subscription ending exactly now as inactive', async () => {
      repository.findByUserId.mockResolvedValue({ endDate: now });

      await expect(service.getSubscription('user-1')).resolves.toEqual({
        status: 'INACTIVE',
      });
      expect(repository.findByUserId).toHaveBeenCalledTimes(1);
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('reports a subscription ending in the past as inactive', async () => {
      const endDate = new Date(now.getTime() - 1);
      repository.findByUserId.mockResolvedValue({ endDate });

      await expect(service.getSubscription('user-1')).resolves.toEqual({
        status: 'INACTIVE',
      });
      expect(repository.findByUserId).toHaveBeenCalledTimes(1);
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('reports an absent subscription as inactive', async () => {
      repository.findByUserId.mockResolvedValue(null);

      await expect(service.getSubscription('user-1')).resolves.toEqual({
        status: 'INACTIVE',
      });
    });
  });
});
