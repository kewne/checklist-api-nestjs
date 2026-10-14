import { AuthGuard } from '@app/auth/auth.guard';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Auth } from 'firebase-admin/auth';
import { testRequest as createTestRequest } from '../../../test/http-request';
import { MyChecklistInstanceController } from './my-checklist-instance.controller';

describe('MyChecklistInstanceController', () => {
  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;

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
    testRequest = createTestRequest(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /my/checklist-instances', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to their canonical collection',
      async (userId) => {
        const response = await testRequest
          .get('/my/checklist-instances')
          .auth(userId, { type: 'bearer' })
          .expect(303);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances`,
        );
      },
    );

    it('rejects an anonymous request', async () => {
      await testRequest.get('/my/checklist-instances').expect(401);
    });
  });

  describe('POST /my/checklist-instances/create', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation',
      async (userId) => {
        const response = await testRequest
          .post('/my/checklist-instances/create')
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances/create`,
        );
      },
    );

    it('ignores a supplied destination user and uses the authenticated user', async () => {
      const response = await testRequest
        .post('/my/checklist-instances/create')
        .query({ userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      expect(response.headers.location).toBe(
        'http://api.example.test/users/user-1/checklist-instances/create',
      );
    });

    it('rejects an anonymous request', async () => {
      await testRequest.post('/my/checklist-instances/create').expect(401);
    });
  });

  describe('POST /my/checklist-instances/:instanceId/create-checklist', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical checklist creation from the selected instance',
      async (userId) => {
        const response = await testRequest
          .post('/my/checklist-instances/456/create-checklist')
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances/456/create-checklist`,
        );
      },
    );

    it('preserves the instance ID and resolves only the authenticated user', async () => {
      const response = await testRequest
        .post('/my/checklist-instances/instance-2/create-checklist')
        .query({ userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      expect(response.headers.location).toBe(
        'http://api.example.test/users/user-1/checklist-instances/instance-2/create-checklist',
      );
    });

    it('rejects an anonymous request', async () => {
      await testRequest
        .post('/my/checklist-instances/456/create-checklist')
        .expect(401);
    });
  });

  describe('POST /my/checklist-instances/create-from-checklist', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation from the selected checklist',
      async (userId) => {
        const response = await testRequest
          .post('/my/checklist-instances/create-from-checklist')
          .query({ checklist_id: 'checklist-1' })
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances/create-from-checklist?checklist_id=checklist-1`,
        );
      },
    );

    it('preserves the checklist query and resolves only the authenticated user', async () => {
      const checklistId = 'checklist + &/?=';
      const response = await testRequest
        .post('/my/checklist-instances/create-from-checklist')
        .query({ checklist_id: checklistId, userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      expect(response.headers.location).toBe(
        'http://api.example.test/users/user-1/checklist-instances/create-from-checklist?checklist_id=checklist+%2B+%26%2F%3F%3D',
      );
    });

    it('rejects an anonymous request', async () => {
      await testRequest
        .post('/my/checklist-instances/create-from-checklist')
        .query({ checklist_id: 'checklist-1' })
        .expect(401);
    });
  });
});
