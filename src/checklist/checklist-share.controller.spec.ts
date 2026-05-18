import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { AbilityFactory } from '@app/casl/ability.factory';
import { CaslForbiddenErrorFilter } from '@app/casl/casl-forbidden-error.filter';
import { ABILITY_KEY } from '@app/casl/casl.interceptor';
import { LinkObject, PlainResource } from '@app/hateoas';
import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { HateoasModule } from '../hateoas/hateoas.module';
import { ChecklistShareController } from './checklist-share.controller';
import { ShareService } from './share.service';

describe('ChecklistShareController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Pick<ShareService, 'listShares' | 'getShare'>>;
  const mockUser: AuthUser = { uid: 'owner-uid' };
  const abilityFactory = new AbilityFactory();

  beforeEach(async () => {
    serviceMock = {
      listShares: jest.fn(),
      getShare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [ChecklistShareController],
      providers: [
        {
          provide: ShareService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    app.useGlobalFilters(new CaslForbiddenErrorFilter());

    app.use(
      (
        req: Request & { [USER_AUTH_KEY]: AuthUser; [key: symbol]: unknown },
        _res: Response,
        next: NextFunction,
      ) => {
        req[USER_AUTH_KEY] = mockUser;
        req[ABILITY_KEY] = abilityFactory.createForUser(mockUser);
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

  describe('GET /checklists/:checklistId/shares', () => {
    it('should return 200 with items links for each share', async () => {
      serviceMock.listShares.mockResolvedValue([
        {
          id: 'share-2',
          checklistId: 'checklist-1',
          userId: 'user-b',
          title: 'Share B',
          createdAt: new Date('2026-05-02T00:00:00.000Z'),
        },
        {
          id: 'share-1',
          checklistId: 'checklist-1',
          userId: 'user-a',
          title: 'Share A',
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares')
        .expect(200);

      const body = response.body as PlainResource;
      const items = body._links.items as LinkObject[];
      expect(items).toHaveLength(2);
      expect(items[0].href).toMatch(
        /\/checklists\/checklist-1\/shares\/share-2$/,
      );
      expect(items[0].title).toBe('Share B');
      expect(items[1].href).toMatch(
        /\/checklists\/checklist-1\/shares\/share-1$/,
      );
      expect(items[1].title).toBe('Share A');
    });

    it('should return 200 with no items key when list is empty', async () => {
      serviceMock.listShares.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares')
        .expect(200);

      const body = response.body as PlainResource;
      expect(body._links.items).toBeUndefined();
    });

    it('should return 404 when checklist does not exist', async () => {
      serviceMock.listShares.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .get('/checklists/non-existent/shares')
        .expect(404);
    });

    it('should return 403 when caller is not the checklist owner', async () => {
      serviceMock.listShares.mockImplementation((_checklistId, ability) => {
        ForbiddenError.from(ability).throwUnlessCan(
          'read',
          subject('ChecklistShare', {
            checklist: { createdBy: 'different-owner' },
          }),
        );
        return Promise.resolve([]);
      });

      await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares')
        .expect(403);
    });
  });

  describe('GET /checklists/:checklistId/shares/:shareId', () => {
    it('should return 200 with userId and createdAt', async () => {
      const createdAt = new Date('2026-05-01T00:00:00.000Z');
      serviceMock.getShare.mockResolvedValue({
        id: 'share-1',
        checklistId: 'checklist-1',
        userId: 'user-a',
        title: 'My Share',
        createdAt,
      });

      const response = await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares/share-1')
        .expect(200);

      const body = response.body as PlainResource;
      expect(body.userId).toBe('user-a');
      expect(body.title).toBe('My Share');
      expect(body.createdAt).toBe(createdAt.toISOString());
    });

    it('should return 404 when share does not exist', async () => {
      serviceMock.getShare.mockRejectedValue(new NotFoundException());

      await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares/non-existent')
        .expect(404);
    });

    it('should return 403 when caller is not the checklist owner', async () => {
      serviceMock.getShare.mockImplementation(
        (_checklistId, _shareId, ability) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'read',
            subject('ChecklistShare', {
              checklist: { createdBy: 'different-owner' },
            }),
          );
          return Promise.resolve({
            id: 'share-1',
            checklistId: 'checklist-1',
            userId: 'user-a',
            title: 'My Share',
            createdAt: new Date(),
          });
        },
      );

      await request(app.getHttpServer())
        .get('/checklists/checklist-1/shares/share-1')
        .expect(403);
    });
  });
});
