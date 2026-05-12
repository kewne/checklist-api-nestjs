import { PlainResource } from '@app/hateoas';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HateoasModule } from '../hateoas/hateoas.module';
import { InstanceService } from './instance.service';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';
import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { Request, Response, NextFunction } from 'express';

describe('UserChecklistInstanceController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<
    Omit<InstanceService, 'checklistService' | 'instanceRepository'>
  >;
  const userId = 'test-user-id';
  const mockUser: AuthUser = { uid: userId };

  beforeEach(async () => {
    serviceMock = {
      createInstance: jest.fn(),
      createFromData: jest.fn(),
      findCreatedBy: jest.fn(),
      findOne: jest.fn(),
      completeItem: jest.fn(),
      markItemIncomplete: jest.fn(),
      remove: jest.fn(),
      replace: jest.fn(),
      addItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [UserChecklistInstanceController],
      providers: [
        {
          provide: InstanceService,
          useValue: serviceMock,
        },
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

  describe('GET /users/:userId/checklist-instances', () => {
    it('should return a resource with items rel containing links to each instance, sorted by creation date ascending', async () => {
      // Arrange
      const createdAt1 = new Date('2026-01-01T10:00:00Z');
      const createdAt2 = new Date('2026-03-15T14:30:00Z');
      const instances = [
        {
          id: 'instance-1',
          checklistId: 'checklist-1',
          createdBy: userId,
          createdAt: createdAt1,
          title: 'First Instance',
          items: [],
        },
        {
          id: 'instance-2',
          checklistId: 'checklist-2',
          createdBy: userId,
          createdAt: createdAt2,
          title: 'Second Instance',
          items: [],
        },
      ];
      (serviceMock.findCreatedBy as jest.Mock).mockResolvedValue(instances);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklist-instances`)
        .expect(200);

      expect(serviceMock.findCreatedBy).toHaveBeenCalledWith(userId);

      const resource = response.body as PlainResource;
      expect(resource._links.items).toEqual([
        {
          href: expect.stringMatching(
            /\/checklist-instances\/instance-1$/,
          ) as string,
          name: 'instance-1',
          title: 'First Instance',
        },
        {
          href: expect.stringMatching(
            /\/checklist-instances\/instance-2$/,
          ) as string,
          name: 'instance-2',
          title: 'Second Instance',
        },
      ]);
    });

    it('should return empty items array when user has no instances', async () => {
      (serviceMock.findCreatedBy as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklist-instances`)
        .expect(200);

      expect(serviceMock.findCreatedBy).toHaveBeenCalledWith(userId);

      const resource = response.body as PlainResource;
      expect(resource._links.items ?? []).toEqual([]);
    });
  });

  describe('POST /users/:userId/checklist-instances', () => {
    it('should create an instance and return 201 with location header', async () => {
      const dto = {
        title: 'My Instance',
        items: [{ title: 'Item 1' }],
      };
      serviceMock.createFromData.mockResolvedValue('new-instance-id');

      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/checklist-instances/create`)
        .send(dto)
        .expect(201);

      expect(serviceMock.createFromData).toHaveBeenCalledWith(userId, dto);
      expect(response.headers.location).toMatch(
        /\/checklist-instances\/new-instance-id$/,
      );
    });
  });
});
