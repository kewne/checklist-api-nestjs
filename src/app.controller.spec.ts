import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UserChecklistController } from './checklist/user-checklist.controller';
import { UserChecklistInstanceController } from './checklist/instance/user-checklist-instance.controller';
import { ChecklistService } from './checklist/checklist.service';
import { InstanceService } from './checklist/instance/instance.service';
import { HateoasModule } from './hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { USER_AUTH_KEY } from './auth/auth.constants';
import { AuthUser } from './auth/auth.guard';
import { Request, Response, NextFunction } from 'express';
import { PlainResource, LinkObject } from '@app/hateoas';

describe('AppController', () => {
  let app: NestExpressApplication;
  const mockUser: AuthUser = { uid: 'test-user-id' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [
        AppController,
        UserChecklistController,
        UserChecklistInstanceController,
      ],
      providers: [
        { provide: ChecklistService, useValue: {} },
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
        req[USER_AUTH_KEY] = mockUser;
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
      ]);
    });
  });
});
