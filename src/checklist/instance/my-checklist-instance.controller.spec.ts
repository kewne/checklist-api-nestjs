import { AuthGuard } from '@app/auth/auth.guard';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Auth } from 'firebase-admin/auth';
import request from 'supertest';
import { MyChecklistInstanceController } from './my-checklist-instance.controller';

describe('MyChecklistInstanceController', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [MyChecklistInstanceController],
      providers: [
        AuthGuard,
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
    await app.close();
  });

  describe('GET /my/checklist-instances', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to their canonical collection',
      async (userId) => {
        const response = await request(app.getHttpServer())
          .get('/my/checklist-instances')
          .auth(userId, { type: 'bearer' })
          .expect(303);

        expect(new URL(response.headers.location).pathname).toBe(
          `/users/${userId}/checklist-instances`,
        );
        expect(new URL(response.headers.location).search).toBe('');
      },
    );

    it('rejects an anonymous request', async () => {
      await request(app.getHttpServer())
        .get('/my/checklist-instances')
        .expect(401);
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/my/checklist-instances')
        .auth('invalid', { type: 'bearer' })
        .expect(401);
    });
  });

  describe('POST /my/checklist-instances/create', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation',
      async (userId) => {
        const response = await request(app.getHttpServer())
          .post('/my/checklist-instances/create')
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(new URL(response.headers.location).pathname).toBe(
          `/users/${userId}/checklist-instances/create`,
        );
        expect(new URL(response.headers.location).search).toBe('');
      },
    );

    it('ignores a supplied destination user and uses the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/my/checklist-instances/create')
        .query({ userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      const destination = new URL(response.headers.location);
      expect(destination.pathname).toBe(
        '/users/user-1/checklist-instances/create',
      );
      expect(destination.search).toBe('');
    });

    it('rejects an anonymous request', async () => {
      await request(app.getHttpServer())
        .post('/my/checklist-instances/create')
        .expect(401);
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .post('/my/checklist-instances/create')
        .auth('invalid', { type: 'bearer' })
        .expect(401);
    });
  });
});
