import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { InstanceService } from './instance.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

describe('ChecklistInstanceController', () => {
  let app: NestExpressApplication;
  const service = {
    findOne: jest.fn(),
    completeItem: jest.fn(),
    markItemIncomplete: jest.fn(),
    remove: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [ChecklistInstanceController],
      providers: [
        {
          provide: InstanceService,
          useValue: service,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  describe('GET /checklist-instances/:instanceId', () => {
    it('should return instance with HATEOAS links when found', async () => {
      service.findOne.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [],
      });

      const response = await request(app.getHttpServer())
        .get('/checklist-instances/456')
        .expect(200);

      expect(service.findOne).toHaveBeenCalledWith('456');
      expect((response.body as Record<string, unknown>).id).toBe('456');
      expect((response.body as Record<string, unknown>).title).toBe(
        'My Instance',
      );
      expect((response.body as Record<string, unknown>)._links).toBeDefined();
      const links = (response.body as Record<string, unknown>)._links as Record<
        string,
        unknown
      >;
      expect(links.self).toBeDefined();
      expect(links.checklist).toBeDefined();
      const checklistLink = links.checklist as Record<string, unknown>;
      expect(checklistLink.href as string).toMatch(/\/checklists\/123$/);
    });

    it('should include mark-incomplete-item links for completed items', async () => {
      service.findOne.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [
          { id: 'item-1', title: 'Incomplete Item', description: 'desc' },
          {
            id: 'item-2',
            title: 'Completed Item',
            description: 'desc',
            completed: { completed_at: '2026-04-20T10:00:00.000Z' },
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/checklist-instances/456')
        .expect(200);

      const links = (response.body as Record<string, unknown>)._links as Record<
        string,
        unknown
      >;
      expect(links['complete-item']).toBeDefined();
      expect(links['mark-incomplete-item']).toBeDefined();
    });

    it('should return 404 when instance not found', async () => {
      service.findOne.mockImplementation(() => {
        throw new NotFoundException('Checklist instance not found');
      });

      await request(app.getHttpServer())
        .get('/checklist-instances/non-existent')
        .expect(404);

      expect(service.findOne).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('POST /checklist-instances/:instanceId/items/:itemId/complete', () => {
    it('should return 303 with location header pointing to instance', async () => {
      service.completeItem.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(303);

      expect(service.completeItem).toHaveBeenCalledWith(
        '456',
        'item-1',
        undefined,
      );
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should pass note to service when provided', async () => {
      service.completeItem.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/complete')
        .send({ note: 'Well done' })
        .expect(303);

      expect(service.completeItem).toHaveBeenCalledWith(
        '456',
        'item-1',
        'Well done',
      );
    });

    it('should return 409 when item is already completed', async () => {
      service.completeItem.mockRejectedValue(
        new ConflictException('Item already completed'),
      );

      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(409);
    });

    it('should return 404 when instance or item is not found', async () => {
      service.completeItem.mockRejectedValue(
        new NotFoundException('Instance not found'),
      );

      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(404);
    });

    it('should return 400 when note exceeds 500 characters', async () => {
      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/complete')
        .send({ note: 'a'.repeat(501) })
        .expect(400);

      expect(service.completeItem).not.toHaveBeenCalled();
    });
  });

  describe('POST /checklist-instances/:instanceId/items/:itemId/incomplete', () => {
    it('should return 303 with location header pointing to instance', async () => {
      service.markItemIncomplete.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(303);

      expect(service.markItemIncomplete).toHaveBeenCalledWith('456', 'item-1');
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should return 409 when item is not completed', async () => {
      service.markItemIncomplete.mockRejectedValue(
        new ConflictException('Item is not completed'),
      );

      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(409);
    });

    it('should return 404 when instance or item is not found', async () => {
      service.markItemIncomplete.mockRejectedValue(
        new NotFoundException('Instance not found'),
      );

      await request(app.getHttpServer())
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(404);
    });
  });

  describe('PUT /checklist-instances/:instanceId', () => {
    it('should return 204 with no response body on success', async () => {
      service.replace.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .put('/checklist-instances/456')
        .send({ title: 'Updated Title', items: [{ title: 'Updated Item' }] })
        .expect(204);

      expect(service.replace).toHaveBeenCalledWith('456', {
        title: 'Updated Title',
        items: [{ title: 'Updated Item' }],
      });
      expect(response.body).toEqual({});
    });

    it('should return 404 when instance not found', async () => {
      service.replace.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await request(app.getHttpServer())
        .put('/checklist-instances/non-existent')
        .send({ title: 'Title', items: [] })
        .expect(404);
    });

    it('should return 400 when title is missing', async () => {
      await request(app.getHttpServer())
        .put('/checklist-instances/456')
        .send({ items: [] })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });

    it('should return 400 when items is missing', async () => {
      await request(app.getHttpServer())
        .put('/checklist-instances/456')
        .send({ title: 'Title' })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });

    it('should return 400 when an item title is missing', async () => {
      await request(app.getHttpServer())
        .put('/checklist-instances/456')
        .send({ title: 'Title', items: [{ id: 'item-1' }] })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /checklist-instances/:instanceId', () => {
    it('should remove instance and return 200 status', async () => {
      service.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/checklist-instances/456')
        .expect(200);

      expect(service.remove).toHaveBeenCalledWith('456');
    });

    it('should return 404 when instance not found', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await request(app.getHttpServer())
        .delete('/checklist-instances/non-existent')
        .expect(404);

      expect(service.remove).toHaveBeenCalledWith('non-existent');
    });
  });
});
