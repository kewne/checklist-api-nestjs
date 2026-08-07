import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { ForbiddenError } from '@casl/ability';
import { UserChecklistController } from './user-checklist.controller';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { ShareService } from './share.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PlainResource, LinkObject } from '@app/hateoas';
import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { AbilityFactory } from '@app/casl/ability.factory';
import { CaslForbiddenErrorFilter } from '@app/casl/casl-forbidden-error.filter';
import { ABILITY_KEY } from '@app/casl/casl.interceptor';
import { NextFunction, Request, Response } from 'express';

describe('UserChecklistController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Omit<ChecklistService, 'repository'>>;
  let shareServiceMock: jest.Mocked<
    Pick<ShareService, 'listChecklistsSharedWithUser'>
  >;
  let userId: string;
  let mockUser: AuthUser;
  const abilityFactory = new AbilityFactory();

  beforeEach(async () => {
    userId = randomUUID();
    mockUser = { uid: userId };
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      replace: jest.fn(),
    };

    shareServiceMock = {
      listChecklistsSharedWithUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [UserChecklistController, ChecklistController],
      providers: [
        {
          provide: ChecklistService,
          useValue: serviceMock,
        },
        {
          provide: ShareService,
          useValue: shareServiceMock,
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

  describe('POST /users/:userId/checklists', () => {
    it('should create a checklist and return 201 with location header', async () => {
      // Arrange
      const createDto: CreateChecklistDto = { title: 'Test Checklist' };
      const createdChecklist = {
        id: '123',
        title: createDto.title,
        items: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      serviceMock.create.mockResolvedValue(createdChecklist);

      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/checklists`)
        .send(createDto)
        .expect(201);

      expect(serviceMock.create).toHaveBeenCalledWith(createDto, userId);
      expect(response.headers.location).toMatch(/\/checklists\/123$/);
    });
  });

  describe('GET /users/:userId/checklists', () => {
    it('should return a resource with items rel containing links to each user checklist', async () => {
      // Arrange
      const checklists = [
        {
          id: '1',
          title: 'Checklist 1',
          items: [
            { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          ],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Checklist 2',
          items: [],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (serviceMock.findAllByUser as jest.Mock).mockResolvedValue(checklists);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklists`)
        .expect(200);

      expect(serviceMock.findAllByUser).toHaveBeenCalledWith(userId);

      const resource = response.body as PlainResource;
      expect(resource).toHaveProperty('_links');
      expect(resource._links).toHaveProperty('items');

      const items = resource._links.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(2);

      // Verify first item
      expect(items[0]).toHaveProperty('href');
      expect(items[0]).toHaveProperty('name', 'Checklist 1');
      expect((items[0] as LinkObject).href).toMatch(/\/checklists\/1$/);

      // Verify second item
      expect(items[1]).toHaveProperty('href');
      expect(items[1]).toHaveProperty('name', 'Checklist 2');
      expect((items[1] as LinkObject).href).toMatch(/\/checklists\/2$/);
    });

    it('should return resource with items rel absent when no checklists exist', async () => {
      // Arrange
      (serviceMock.findAllByUser as jest.Mock).mockResolvedValue([]);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklists`)
        .expect(200);

      expect(serviceMock.findAllByUser).toHaveBeenCalledWith(userId);

      const resource = response.body as PlainResource;
      expect(resource).toHaveProperty('_links');
      expect(resource._links).not.toHaveProperty('items');
    });

    it('should include a related link to the shared checklists endpoint', async () => {
      (serviceMock.findAllByUser as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklists`)
        .expect(200);

      const resource = response.body as PlainResource;
      expect(resource._links).toHaveProperty('related');
      const related = resource._links.related as LinkObject;
      expect(related.href).toMatch(
        new RegExp(`/users/${userId}/checklists/shared$`),
      );
    });
  });

  describe('GET /users/:userId/checklists/shared', () => {
    it('should return 200 with items links for each shared checklist', async () => {
      const checklists = [
        {
          id: 'cl-1',
          title: 'Shared One',
          items: [],
          createdBy: 'other-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cl-2',
          title: 'Shared Two',
          items: [],
          createdBy: 'other-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      shareServiceMock.listChecklistsSharedWithUser.mockResolvedValue(
        checklists,
      );

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklists/shared`)
        .expect(200);

      const resource = response.body as PlainResource;
      expect(resource._links).toHaveProperty('items');
      const items = resource._links.items as LinkObject[];
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(2);
      expect(items[0].href).toMatch(/\/checklists\/cl-1$/);
      expect(items[0].name).toBe('Shared One');
      expect(items[1].href).toMatch(/\/checklists\/cl-2$/);
      expect(items[1].name).toBe('Shared Two');
    });

    it('should return 200 with no items rel when no checklists are shared', async () => {
      shareServiceMock.listChecklistsSharedWithUser.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklists/shared`)
        .expect(200);

      const resource = response.body as PlainResource;
      expect(resource._links).not.toHaveProperty('items');
    });

    it("should return 403 when requesting another user's shared checklists", async () => {
      shareServiceMock.listChecklistsSharedWithUser.mockRejectedValue(
        new ForbiddenError(
          null,
          null,
          null,
          'Cannot read ChecklistsSharedWithUser',
        ),
      );

      await request(app.getHttpServer())
        .get(`/users/other-user/checklists/shared`)
        .expect(403);
    });
  });
});
