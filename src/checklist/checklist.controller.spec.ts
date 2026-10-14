import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { PlainResource } from '@app/hateoas';
import { NotFoundException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import { testRequest as createTestRequest } from '../../test/http-request';
import { HateoasModule } from '../hateoas/hateoas.module';
import { resourceEnrichers, ResourceTypes } from '../resource-enrichers';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';

describe('ChecklistController', () => {
  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;
  let serviceMock: jest.Mocked<Omit<ChecklistService, 'repository'>>;
  const mockUser: AuthUser = { uid: 'test-user-id' };

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
      imports: [
        HateoasModule.registerEnrichers<ResourceTypes>(resourceEnrichers),
      ],
      controllers: [ChecklistController],
      providers: [
        {
          provide: ChecklistService,
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

  describe('GET /checklists/:id', () => {
    it('should return a checklist with HATEOAS links and 200 status when checklist exists', async () => {
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

      const response = await testRequest.get('/checklists/123').expect(200);

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
      expect(resource._links).toEqual<PlainResource['_links']>({
        self: {
          href: 'http://api.example.test/checklists/123',
        },
        'create-from': {
          name: 'instance',
          href: 'http://api.example.test/my/checklist-instances/create-from-checklist?checklist_id=123',
        },
        related: {
          name: 'shares',
          href: 'http://api.example.test/checklists/123/shares',
        },
      });
    });

    it('keeps the entire representation independent of the authenticated user', async () => {
      const checklist = {
        id: '123',
        title: 'Shared Checklist',
        items: [],
        createdBy: 'owner',
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: new Date('2026-10-02T00:00:00Z'),
      };
      serviceMock.findOne.mockResolvedValue(checklist);

      const resources: PlainResource[] = [];
      for (const userId of ['owner', 'recipient']) {
        const response = await testRequest
          .get('/checklists/123')
          .set('x-test-user', userId)
          .expect(200);
        resources.push(response.body as PlainResource);
      }

      expect(resources[0]).toEqual<PlainResource>({
        ...checklist,
        createdAt: checklist.createdAt.toISOString(),
        updatedAt: checklist.updatedAt.toISOString(),
        _links: {
          self: { href: 'http://api.example.test/checklists/123' },
          'create-from': {
            name: 'instance',
            href: 'http://api.example.test/my/checklist-instances/create-from-checklist?checklist_id=123',
          },
          related: {
            name: 'shares',
            href: 'http://api.example.test/checklists/123/shares',
          },
        },
      });
      expect(resources[0]).toEqual(resources[1]);
    });

    it('should return a checklist with empty items array when no items exist', async () => {
      const checklist = {
        id: '124',
        title: 'Empty Checklist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'eau',
      };

      serviceMock.findOne.mockResolvedValue(checklist);

      const response = await testRequest.get('/checklists/124').expect(200);

      expect((response.body as Record<string, unknown>).items).toEqual([]);
    });

    it('should return null and 200 status when checklist does not exist', async () => {
      serviceMock.findOne.mockResolvedValue(null);

      // Act & Assert
      const response = await testRequest.get('/checklists/999').expect(200);

      expect(serviceMock.findOne).toHaveBeenCalledWith('999');
      expect(response.body).toEqual({});
    });
  });

  describe('DELETE /checklists/:id', () => {
    it('should remove a checklist and return 200 status', async () => {
      // Arrange
      (serviceMock.remove as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await testRequest.delete('/checklists/123').expect(200);

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
      const response = await testRequest
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
      await testRequest
        .put('/checklists/nonexistent')
        .send({ title: 'Updated Checklist' })
        .expect(404);
    });
  });
});
