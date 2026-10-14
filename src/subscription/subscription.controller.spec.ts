import { AuthGuard } from '@app/auth/auth.guard';
import { CaslModule } from '@app/casl/casl.module';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { resourceEnrichers, ResourceTypes } from '@app/resource-enrichers';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Auth } from 'firebase-admin/auth';
import request from 'supertest';
import { MySubscriptionController } from './my-subscription.controller';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

describe('Subscription HTTP endpoints', () => {
  let app: NestExpressApplication;
  let service: jest.Mocked<Pick<SubscriptionService, 'getSubscription'>>;

  beforeEach(async () => {
    service = { getSubscription: jest.fn() };
    const module = await Test.createTestingModule({
      imports: [
        CaslModule,
        HateoasModule.registerEnrichers<ResourceTypes>(resourceEnrichers),
      ],
      controllers: [SubscriptionController, MySubscriptionController],
      providers: [
        AuthGuard,
        { provide: SubscriptionService, useValue: service },
        {
          provide: Auth,
          useValue: {
            verifyIdToken: jest.fn((token: string) => {
              if (token === 'user-1' || token === 'user-2') {
                return Promise.resolve({ uid: token });
              }
              return Promise.reject(new Error('Invalid token'));
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.useGlobalGuards(module.get(AuthGuard));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe('GET /users/:userId/subscription', () => {
    it('returns an active subscription with its end date', async () => {
      service.getSubscription.mockResolvedValue({
        status: 'ACTIVE',
        endDate: new Date('2027-01-01T00:00:00Z'),
      });

      const response = await request(app.getHttpServer())
        .get('/users/user-1/subscription')
        .auth('user-1', { type: 'bearer' })
        .expect(200);

      expect(response.body).toEqual({
        status: 'ACTIVE',
        endDate: '2027-01-01T00:00:00.000Z',
        _links: {
          self: {
            href: expect.stringMatching(
              /\/users\/user-1\/subscription$/,
            ) as string,
          },
        },
      });
      expect(service.getSubscription).toHaveBeenCalledTimes(1);
      expect(service.getSubscription).toHaveBeenCalledWith('user-1');
    });

    it('returns an inactive subscription without an end date', async () => {
      service.getSubscription.mockResolvedValue({ status: 'INACTIVE' });

      const response = await request(app.getHttpServer())
        .get('/users/user-1/subscription')
        .auth('user-1', { type: 'bearer' })
        .expect(200);

      expect(response.body).toEqual({
        status: 'INACTIVE',
        _links: {
          self: {
            href: expect.stringMatching(
              /\/users\/user-1\/subscription$/,
            ) as string,
          },
        },
      });
      expect(service.getSubscription).toHaveBeenCalledTimes(1);
      expect(service.getSubscription).toHaveBeenCalledWith('user-1');
    });

    it('denies another user before retrieving any subscription', async () => {
      await request(app.getHttpServer())
        .get('/users/user-2/subscription')
        .auth('user-1', { type: 'bearer' })
        .expect(403);

      expect(service.getSubscription).not.toHaveBeenCalled();
    });

    it('does not allow anonymous users to access the subscription', async () => {
      await request(app.getHttpServer())
        .get('/users/user-1/subscription')
        .expect(401);
      expect(service.getSubscription).not.toHaveBeenCalled();
    });
  });

  describe('GET /my/subscription', () => {
    it('redirects the first user without retrieving subscription data', async () => {
      const response = await request(app.getHttpServer())
        .get('/my/subscription')
        .auth('user-1', { type: 'bearer' })
        .expect(303);

      expect(response.headers.location).toMatch(/\/users\/user-1\/subscription$/);
      expect(response.text).toBe('');
      expect(service.getSubscription).not.toHaveBeenCalled();
    });

    it('redirects the second user to their own subscription without retrieving data', async () => {
      const response = await request(app.getHttpServer())
        .get('/my/subscription')
        .auth('user-2', { type: 'bearer' })
        .expect(303);

      expect(response.headers.location).toMatch(/\/users\/user-2\/subscription$/);
      expect(response.text).toBe('');
      expect(service.getSubscription).not.toHaveBeenCalled();
    });

    it('does not allow anonymous users to access the subscription', async () => {
      await request(app.getHttpServer()).get('/my/subscription').expect(401);
      expect(service.getSubscription).not.toHaveBeenCalled();
    });
  });
});
