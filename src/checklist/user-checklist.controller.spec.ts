import { Test, TestingModule } from '@nestjs/testing';
import { UserChecklistController } from './user-checklist.controller';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { PlainResource, LinkObject } from '@app/hateoas';

describe('UserChecklistController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Omit<ChecklistService, 'repository'>>;
  const userId = 'test-user-id';

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      replace: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [UserChecklistController, ChecklistController],
      providers: [
        {
          provide: ChecklistService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
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

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/checklists`)
        .send(createDto)
        .expect(201);

      expect(serviceMock.create).toHaveBeenCalledWith(createDto, userId);
      expect(response.headers['location']).toMatch(/\/checklists\/123$/);
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

      // Act & Assert
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
  });
});
