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
          .set('Host', 'api.example.test')
          .auth(userId, { type: 'bearer' })
          .expect(303);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances`,
        );
      },
    );

    it('rejects an anonymous request', async () => {
      await request(app.getHttpServer())
        .get('/my/checklist-instances')
        .set('Host', 'api.example.test')
        .expect(401);
    });
  });

  describe('POST /my/checklist-instances/create', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation',
      async (userId) => {
        const response = await request(app.getHttpServer())
          .post('/my/checklist-instances/create')
          .set('Host', 'api.example.test')
          .auth(userId, { type: 'bearer' })
          .expect(307);

        expect(response.headers.location).toBe(
          `http://api.example.test/users/${userId}/checklist-instances/create`,
        );
      },
    );

    it('ignores a supplied destination user and uses the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/my/checklist-instances/create')
        .set('Host', 'api.example.test')
        .query({ userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      expect(response.headers.location).toBe(
        'http://api.example.test/users/user-1/checklist-instances/create',
      );
    });

    it('rejects an anonymous request', async () => {
      await request(app.getHttpServer())
        .post('/my/checklist-instances/create')
        .set('Host', 'api.example.test')
        .expect(401);
    });
  });

  describe('POST /my/checklist-instances/create-from-checklist', () => {
    it.each(['user-1', 'user-2'])(
      'redirects %s to canonical creation from the selected checklist',
      async (userId) => {
        const response = await request(app.getHttpServer())
          .post('/my/checklist-instances/create-from-checklist')
          .set('Host', 'api.example.test')
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
      const response = await request(app.getHttpServer())
        .post('/my/checklist-instances/create-from-checklist')
        .set('Host', 'api.example.test')
        .query({ checklist_id: checklistId, userId: 'user-2' })
        .auth('user-1', { type: 'bearer' })
        .expect(307);

      expect(response.headers.location).toBe(
        'http://api.example.test/users/user-1/checklist-instances/create-from-checklist?checklist_id=checklist+%2B+%26%2F%3F%3D',
      );
    });

    it('rejects an anonymous request', async () => {
      await request(app.getHttpServer())
        .post('/my/checklist-instances/create-from-checklist')
        .set('Host', 'api.example.test')
        .query({ checklist_id: 'checklist-1' })
        .expect(401);
    });
  });
});
