import { Test, TestingModule } from '@nestjs/testing';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';
import { InstanceService } from './instance.service';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { PlainResource, LinkObject } from '@app/hateoas';

describe('UserChecklistInstanceController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<
    Omit<InstanceService, 'checklistService' | 'instanceRepository'>
  >;
  const userId = 'test-user-id';

  beforeEach(async () => {
    serviceMock = {
      createInstance: jest.fn(),
      findCreatedBy: jest.fn(),
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
      expect(resource).toHaveProperty('_links');
      expect(resource._links).toHaveProperty('items');

      const items = resource._links.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(2);

      // Verify first item (oldest)
      expect(items[0]).toHaveProperty('href');
      expect(items[0]).toHaveProperty('name', 'First Instance');
      expect((items[0] as LinkObject).href).toMatch(
        /\/checklist-instances\/instance-1$/,
      );

      // Verify second item (newer)
      expect(items[1]).toHaveProperty('href');
      expect(items[1]).toHaveProperty('name', 'Second Instance');
      expect((items[1] as LinkObject).href).toMatch(
        /\/checklist-instances\/instance-2$/,
      );
    });

    it('should return empty items array when user has no instances', async () => {
      // Arrange
      (serviceMock.findCreatedBy as jest.Mock).mockResolvedValue([]);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/checklist-instances`)
        .expect(200);

      expect(serviceMock.findCreatedBy).toHaveBeenCalledWith(userId);

      const resource = response.body as PlainResource;
      expect(resource._links.items ?? []).toEqual([]);
    });
  });
});
