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
import request from 'supertest';
import { USER_AUTH_KEY } from './auth/auth.constants';
import { AuthUser } from './auth/auth.guard';
import { Request, Response, NextFunction } from 'express';
import { PlainResource, LinkObject } from '@app/hateoas';
import { MySubscriptionController } from './subscription/my-subscription.controller';

describe('AppController', () => {
  let app: NestExpressApplication;
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
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /', () => {
    it('should return 200 with related links for checklists and checklist-instances', async () => {
      const response = await request(app.getHttpServer()).get('/').expect(200);

      const resource = response.body as PlainResource;
      const related = resource._links.related as LinkObject[];

      expect(related).toEqual([
        {
          name: 'checklists',
          href: expect.stringMatching(
            '/users/test-user-id/checklists',
          ) as string,
        },
        {
          name: 'checklist-instances',
          href: expect.stringMatching(
            /\/users\/test-user-id\/checklist-instances$/,
          ) as string,
        },
        {
          name: 'subscription',
          href: expect.stringMatching(/\/my\/subscription$/) as string,
        },
      ]);
    });

    it('keeps subscription discovery independent of the authenticated user', async () => {
      const subscriptionLinks: LinkObject[] = [];
      for (const userId of ['first-user', 'second-user']) {
        const response = await request(app.getHttpServer())
          .get('/')
          .set('x-test-user', userId)
          .expect(200);
        const resource = response.body as PlainResource;
        const related = resource._links.related as LinkObject[];
        const link = related.find((entry) => entry.name === 'subscription');
        expect(link).toEqual({
          name: 'subscription',
          href: expect.stringMatching(/\/my\/subscription$/) as string,
        });
        subscriptionLinks.push({
          ...link!,
          href: new URL(link!.href).pathname,
        });
      }
      expect(subscriptionLinks[0]).toEqual(subscriptionLinks[1]);
    });
  });
});
