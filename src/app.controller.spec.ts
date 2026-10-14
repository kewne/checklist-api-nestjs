import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UserChecklistController } from './checklist/user-checklist.controller';
import { UserChecklistInstanceController } from './checklist/instance/user-checklist-instance.controller';
import { ChecklistService } from './checklist/checklist.service';
import { ShareService } from './checklist/share.service';
import { InstanceService } from './checklist/instance/instance.service';
import { HateoasModule } from './hateoas/hateoas.module';
import { resourceEnrichers, ResourceTypes } from './resource-enrichers';
import { NestExpressApplication } from '@nestjs/platform-express';
import { testRequest as createTestRequest } from '../test/http-request';
import { USER_AUTH_KEY } from './auth/auth.constants';
import { AuthUser } from './auth/auth.guard';
import { Request, Response, NextFunction } from 'express';
import { PlainResource } from '@app/hateoas';
import { MySubscriptionController } from './subscription/my-subscription.controller';
import { MyChecklistController } from './checklist/my-checklist.controller';
import { MyChecklistInstanceController } from './checklist/instance/my-checklist-instance.controller';

describe('AppController', () => {
  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;
  const mockUser: AuthUser = { uid: 'test-user-id' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HateoasModule.registerEnrichers<ResourceTypes>(resourceEnrichers),
      ],
      controllers: [
        AppController,
        UserChecklistController,
        UserChecklistInstanceController,
        MySubscriptionController,
        MyChecklistController,
        MyChecklistInstanceController,
      ],
      providers: [
        { provide: ChecklistService, useValue: {} },
        { provide: ShareService, useValue: {} },
        { provide: InstanceService, useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();

    app.use(
      (
        req: Request & { [USER_AUTH_KEY]: AuthUser },
        _res: Response,
        next: NextFunction,
      ) => {
        const requestedUser = req.headers['x-test-user'];
        req[USER_AUTH_KEY] =
          typeof requestedUser === 'string' ? { uid: requestedUser } : mockUser;
        next();
      },
    );

    await app.init();
    testRequest = createTestRequest(app.getHttpServer());
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /', () => {
    it('returns stable discovery and creation links', async () => {
      const response = await testRequest.get('/').expect(200);

      expect(response.body).toEqual<PlainResource>({
        _links: {
          self: { href: 'http://api.example.test/' },
          related: [
            {
              name: 'checklists',
              href: 'http://api.example.test/my/checklists',
            },
            {
              name: 'checklist-instances',
              href: 'http://api.example.test/my/checklist-instances',
            },
            {
              name: 'subscription',
              href: 'http://api.example.test/my/subscription',
            },
          ],
          create: [
            {
              name: 'checklists',
              href: 'http://api.example.test/my/checklists',
            },
            {
              name: 'checklist-instances',
              href: 'http://api.example.test/my/checklist-instances/create',
            },
          ],
        },
      });
    });

    it('keeps the entire representation independent of the authenticated user', async () => {
      const resources: PlainResource[] = [];
      for (const userId of ['first-user', 'second-user']) {
        const response = await testRequest
          .get('/')
          .set('x-test-user', userId)
          .expect(200);
        resources.push(response.body as PlainResource);
      }
      expect(resources[0]).toEqual(resources[1]);
    });
  });
});
