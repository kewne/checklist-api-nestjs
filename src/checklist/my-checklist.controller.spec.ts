import { AuthGuard } from '@app/auth/auth.guard';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Auth } from 'firebase-admin/auth';
import { testRequest as createTestRequest } from '../../test/http-request';
import { MyChecklistController } from './my-checklist.controller';

describe('MyChecklistController', () => {
  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [MyChecklistController],
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
    testRequest = createTestRequest(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /my/checklists', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to their canonical collection',
      async (userId) => {
        const response = await testRequest
          .get('/my/checklists')
          .auth(userId, { type: 'bearer' })
          .expect(303);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklists`,
        );
      },
    );
  });

  describe('POST /my/checklists', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation',
      async (userId) => {
        const response = await testRequest
          .post('/my/checklists')
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklists`,
        );
      },
    );

    it('preserves the encoded base query and resolves only the authenticated user', async () => {
      const base = Buffer.from(
        JSON.stringify({ title: 'Template & defaults', items: [] }),
      ).toString('base64');

      const response = await testRequest
        .post('/my/checklists')
        .query({ base, userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      const destination = new URL(
        'http://api.example.test/users/user-1/checklists',
      );
      destination.searchParams.set('base', base);
      expect(response.headers.location).toBe(destination.href);
    });
  });

  describe.each(['get', 'post'] as const)(
    '%s /my/checklists authentication',
    (method) => {
      it('rejects an anonymous request', async () => {
        await testRequest[method]('/my/checklists').expect(401);
      });

      it('rejects an invalid token', async () => {
        await testRequest[method]('/my/checklists')
          .auth('invalid', { type: 'bearer' })
          .expect(401);
      });
    },
  );
});
