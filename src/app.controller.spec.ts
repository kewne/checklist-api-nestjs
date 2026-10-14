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
import { LinkObject, PlainResource } from '@app/hateoas';
import { MySubscriptionController } from './subscription/my-subscription.controller';
import { MyChecklistController } from './checklist/my-checklist.controller';
import { MyChecklistInstanceController } from './checklist/instance/my-checklist-instance.controller';

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
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /', () => {
    it('returns stable discovery and creation links', async () => {
      const response = await request(app.getHttpServer()).get('/').expect(200);

      expect(response.body).toEqual<PlainResource>({
        _links: {
          self: { href: expect.stringMatching(/\/$/) as string },
          related: [
            {
              name: 'checklists',
              href: expect.stringMatching(/\/my\/checklists$/) as string,
            },
            {
              name: 'checklist-instances',
              href: expect.stringMatching(
                /\/my\/checklist-instances$/,
              ) as string,
            },
            {
              name: 'subscription',
              href: expect.stringMatching(/\/my\/subscription$/) as string,
            },
          ],
          create: [
            {
              name: 'checklists',
              href: expect.stringMatching(/\/my\/checklists$/) as string,
            },
            {
              name: 'checklist-instances',
              href: expect.stringMatching(
                /\/my\/checklist-instances\/create$/,
              ) as string,
            },
          ],
        },
      });
    });

    it('keeps the entire representation independent of the authenticated user', async () => {
      const resources: PlainResource[] = [];
      const withoutOrigin = (link: LinkObject): LinkObject => {
        const url = new URL(link.href);
        return { ...link, href: `${url.pathname}${url.search}${url.hash}` };
      };
      for (const userId of ['first-user', 'second-user']) {
        const response = await request(app.getHttpServer())
          .get('/')
          .set('x-test-user', userId)
          .expect(200);
        const resource = response.body as PlainResource;
        resources.push({
          ...resource,
          _links: Object.fromEntries(
            Object.entries(resource._links).map(([relation, links]) => [
              relation,
              Array.isArray(links)
                ? links.map(withoutOrigin)
                : withoutOrigin(links),
            ]),
          ),
        });
      }
      expect(resources[0]).toEqual(resources[1]);
    });
  });
});
