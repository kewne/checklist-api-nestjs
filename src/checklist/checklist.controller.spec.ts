import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { PlainResource, LinkObject } from '@app/hateoas';
import { NotFoundException } from '@nestjs/common';

describe('ChecklistController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Omit<ChecklistService, 'repository'>>;

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
      controllers: [ChecklistController],
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

  describe('GET /checklists/:id', () => {
    it('should return a checklist with HATEOAS links and 200 status when checklist exists', async () => {
      // Arrange
      const checklist = {
        id: '123',
        title: 'Test Checklist for Retrieval',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { id: 'item-2', title: 'Item 2', description: 'Description 2' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (serviceMock.findOne as jest.Mock).mockResolvedValue(checklist);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/checklists/123')
        .expect(200);

      expect(serviceMock.findOne).toHaveBeenCalledWith('123');
      expect(response.body).toHaveProperty(
        'title',
        'Test Checklist for Retrieval',
      );
      expect(response.body).toHaveProperty('items');
      expect((response.body as Record<string, unknown>).items).toEqual([
        { id: 'item-1', title: 'Item 1', description: 'Description 1' },
        { id: 'item-2', title: 'Item 2', description: 'Description 2' },
      ]);
      expect(response.body).toHaveProperty('_links');
      const resource = response.body as PlainResource;
      expect(resource._links).toHaveProperty('self');
      expect(resource._links).toHaveProperty('instances');
      expect(resource._links.instances).toHaveProperty('href');
      expect(Array.isArray(resource._links)).toBe(false);
      expect((resource._links.instances as LinkObject).href).toMatch(
        /\/checklists\/123\/instances$/,
      );
    });

    it('should return a checklist with empty items array when no items exist', async () => {
      // Arrange
      const checklist = {
        id: '124',
        title: 'Empty Checklist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (serviceMock.findOne as jest.Mock).mockResolvedValue(checklist);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/checklists/124')
        .expect(200);

      expect((response.body as Record<string, unknown>).items).toEqual([]);
    });

    it('should return null and 200 status when checklist does not exist', async () => {
      // Arrange
      (serviceMock.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/checklists/999')
        .expect(200);

      expect(serviceMock.findOne).toHaveBeenCalledWith('999');
      expect(response.body).toEqual({});
    });
  });

  describe('DELETE /checklists/:id', () => {
    it('should remove a checklist and return 200 status', async () => {
      // Arrange
      (serviceMock.remove as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await request(app.getHttpServer()).delete('/checklists/123').expect(200);

      expect(serviceMock.remove).toHaveBeenCalledWith('123');
    });
  });

  describe('PUT /checklists/:id', () => {
    it('should return the updated checklist with 200 status', async () => {
      // Arrange
      const updatedChecklist = {
        id: '123',
        title: 'Updated Checklist',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { id: 'item-2', title: 'Item 2', description: 'Description 2' },
        ],
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (serviceMock.replace as jest.Mock).mockResolvedValue(updatedChecklist);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .put('/checklists/123')
        .send({
          title: 'Updated Checklist',
          items: [
            { id: 'item-1', title: 'Item 1', description: 'Description 1' },
            { title: 'Item 2', description: 'Description 2' },
          ],
        })
        .expect(200);

      expect(serviceMock.replace).toHaveBeenCalledWith('123', {
        title: 'Updated Checklist',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { title: 'Item 2', description: 'Description 2' },
        ],
      });
      expect(response.body).toEqual(updatedChecklist);
    });

    it('should return 404 when checklist does not exist', async () => {
      // Arrange
      (serviceMock.replace as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      // Act & Assert
      await request(app.getHttpServer())
        .put('/checklists/nonexistent')
        .send({ title: 'Updated Checklist' })
        .expect(404);
    });
  });
});
