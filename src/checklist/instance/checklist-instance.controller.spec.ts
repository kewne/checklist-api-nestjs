import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlainResource } from '@app/hateoas';
import { ForbiddenError, subject } from '@casl/ability';
import { APP_GUARD } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { testRequest as createTestRequest } from '../../../test/http-request';
import { NextFunction, Request, Response } from 'express';
import { USER_AUTH_KEY } from '../../auth/auth.constants';
import { AuthUser } from '../../auth/auth.guard';
import { MockAuthGuard } from '../../auth/auth.guard.mock';
import { AbilityFactory, AppAbility } from '../../casl/ability.factory';
import { CaslForbiddenErrorFilter } from '../../casl/casl-forbidden-error.filter';
import { ABILITY_KEY } from '../../casl/casl.interceptor';
import { HateoasModule } from '../../hateoas/hateoas.module';
import { resourceEnrichers, ResourceTypes } from '../../resource-enrichers';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { InstanceService } from './instance.service';

describe('ChecklistInstanceController', () => {
  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;
  const service = {
    findOne: jest.fn(),
    completeItem: jest.fn(),
    markItemIncomplete: jest.fn(),
    clearCompletedItems: jest.fn(),
    remove: jest.fn(),
    replace: jest.fn(),
    addItem: jest.fn(),
  };
  const mockUser: AuthUser = { uid: 'test-user-id' };
  const abilityFactory = new AbilityFactory();

  beforeEach(async () => {
    mockUser.uid = 'test-user-id';
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HateoasModule.registerEnrichers<ResourceTypes>(resourceEnrichers),
      ],
      controllers: [ChecklistInstanceController],
      providers: [
        {
          provide: InstanceService,
          useValue: service,
        },
        {
          provide: APP_GUARD,
          useValue: new MockAuthGuard(() => mockUser),
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
    testRequest = createTestRequest(app.getHttpServer());
  });

  afterEach(async () => {
    jest.restoreAllMocks();
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

      const response = await testRequest
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
      expect(links['create-from']).toBeDefined();
      const createFromLink = links['create-from'] as Record<string, unknown>;
      expect(createFromLink.name).toBe('checklist');
      expect(createFromLink.href).toBe(
        'http://api.example.test/my/checklist-instances/456/create-checklist',
      );
    });

    it('keeps the representation independent of the caller when both are authorized', async () => {
      const instance = {
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [],
      };
      service.findOne.mockResolvedValue(instance);
      const ability = abilityFactory.createForUser(mockUser);
      jest.spyOn(abilityFactory, 'createForUser').mockReturnValue(ability);

      const resources: PlainResource[] = [];
      for (const userId of ['first-reader', 'second-reader']) {
        mockUser.uid = userId;
        const response = await testRequest
          .get('/checklist-instances/456')
          .expect(200);
        resources.push(response.body as PlainResource);
      }

      expect(resources[0]).toEqual<PlainResource>({
        ...instance,
        createdAt: instance.createdAt.toISOString(),
        _links: {
          self: {
            href: 'http://api.example.test/checklist-instances/456',
          },
          update: {
            name: 'add-item',
            href: 'http://api.example.test/checklist-instances/456/add-item',
          },
          'create-from': {
            name: 'checklist',
            href: 'http://api.example.test/my/checklist-instances/456/create-checklist',
          },
          related: {
            name: 'checklist',
            title: '123',
            href: 'http://api.example.test/checklists/123',
          },
        },
      });
      expect(resources[0]).toEqual(resources[1]);
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

      const response = await testRequest
        .get('/checklist-instances/456')
        .expect(200);

      const links = (response.body as Record<string, unknown>)._links as Record<
        string,
        unknown
      >;
      expect(links['complete-item']).toEqual({
        name: 'item-1',
        title: 'Incomplete Item',
        href: 'http://api.example.test/checklist-instances/456/items/item-1/complete',
      });
      expect(links['mark-incomplete-item']).toEqual({
        name: 'item-2',
        title: 'Completed Item',
        href: 'http://api.example.test/checklist-instances/456/items/item-2/incomplete',
      });
    });

    it('should include clear-completed-items update link when completed items exist', async () => {
      service.findOne.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [
          {
            id: 'item-1',
            title: 'Completed Item',
            completed: { completed_at: '2026-04-20T10:00:00.000Z' },
          },
        ],
      });

      const response = await testRequest
        .get('/checklist-instances/456')
        .expect(200);

      const links = (response.body as Record<string, unknown>)._links as Record<
        string,
        { href: string; name?: string } | { href: string; name?: string }[]
      >;
      const updateLinks = Array.isArray(links.update)
        ? links.update
        : [links.update];
      const clearLink = updateLinks.find(
        (link) => link.name === 'clear-completed-items',
      );
      expect(clearLink).toBeDefined();
      expect(clearLink!.href).toBe(
        'http://api.example.test/checklist-instances/456/clear-completed-items',
      );
    });

    it('should omit clear-completed-items update link when no items are completed', async () => {
      service.findOne.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [{ id: 'item-1', title: 'Incomplete Item' }],
      });

      const response = await testRequest
        .get('/checklist-instances/456')
        .expect(200);

      const links = (response.body as Record<string, unknown>)._links as Record<
        string,
        { href: string; name?: string } | { href: string; name?: string }[]
      >;
      const updateLinks = Array.isArray(links.update)
        ? links.update
        : [links.update];
      expect(
        updateLinks.find((link) => link?.name === 'clear-completed-items'),
      ).toBeUndefined();
    });

    it('should return 404 when instance not found', async () => {
      service.findOne.mockImplementation(() => {
        throw new NotFoundException('Checklist instance not found');
      });

      await testRequest.get('/checklist-instances/non-existent').expect(404);

      expect(service.findOne).toHaveBeenCalledWith('non-existent');
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.findOne.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'other-user',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [],
      });

      await testRequest.get('/checklist-instances/456').expect(403);
    });
  });

  describe('POST /checklist-instances/:instanceId/items/:itemId/complete', () => {
    it('should return 303 with location header pointing to instance', async () => {
      service.completeItem.mockResolvedValue(undefined);

      const response = await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(303);

      expect(service.completeItem).toHaveBeenCalledWith(
        '456',
        'item-1',
        undefined,
        expect.any(Object),
      );
      expect(response.headers.location).toBe(
        'http://api.example.test/checklist-instances/456',
      );
    });

    it('should pass note to service when provided', async () => {
      service.completeItem.mockResolvedValue(undefined);

      await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({ note: 'Well done' })
        .expect(303);

      expect(service.completeItem).toHaveBeenCalledWith(
        '456',
        'item-1',
        'Well done',
        expect.any(Object),
      );
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.completeItem.mockImplementation(
        (_id: string, _itemId: string, _note: unknown, ability: AppAbility) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'update',
            subject('ChecklistInstance', { createdBy: 'other-user' }),
          );
        },
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(403);
    });

    it('should return 409 when item is already completed', async () => {
      service.completeItem.mockRejectedValue(
        new ConflictException('Item already completed'),
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(409);
    });

    it('should return 404 when instance or item is not found', async () => {
      service.completeItem.mockRejectedValue(
        new NotFoundException('Instance not found'),
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({})
        .expect(404);
    });

    it('should return 400 when note exceeds 500 characters', async () => {
      await testRequest
        .post('/checklist-instances/456/items/item-1/complete')
        .send({ note: 'a'.repeat(501) })
        .expect(400);

      expect(service.completeItem).not.toHaveBeenCalled();
    });
  });

  describe('POST /checklist-instances/:instanceId/items/:itemId/incomplete', () => {
    it('should return 303 with location header pointing to instance', async () => {
      service.markItemIncomplete.mockResolvedValue(undefined);

      const response = await testRequest
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(303);

      expect(service.markItemIncomplete).toHaveBeenCalledWith(
        '456',
        'item-1',
        expect.any(Object),
      );
      expect(response.headers.location).toBe(
        'http://api.example.test/checklist-instances/456',
      );
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.markItemIncomplete.mockImplementation(
        (_id: string, _itemId: string, ability: AppAbility) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'update',
            subject('ChecklistInstance', { createdBy: 'other-user' }),
          );
        },
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(403);
    });

    it('should return 409 when item is not completed', async () => {
      service.markItemIncomplete.mockRejectedValue(
        new ConflictException('Item is not completed'),
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(409);
    });

    it('should return 404 when instance or item is not found', async () => {
      service.markItemIncomplete.mockRejectedValue(
        new NotFoundException('Instance not found'),
      );

      await testRequest
        .post('/checklist-instances/456/items/item-1/incomplete')
        .send({})
        .expect(404);
    });
  });

  describe('POST /checklist-instances/:instanceId/clear-completed-items', () => {
    it('should return 303 with location header pointing to instance', async () => {
      service.clearCompletedItems.mockResolvedValue(undefined);

      const response = await testRequest
        .post('/checklist-instances/456/clear-completed-items')
        .expect(303);

      expect(service.clearCompletedItems).toHaveBeenCalledWith(
        '456',
        expect.any(Object),
      );
      expect(response.headers.location).toBe(
        'http://api.example.test/checklist-instances/456',
      );
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.clearCompletedItems.mockImplementation(
        (_id: string, ability: AppAbility) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'update',
            subject('ChecklistInstance', { createdBy: 'other-user' }),
          );
        },
      );

      await testRequest
        .post('/checklist-instances/456/clear-completed-items')
        .expect(403);
    });

    it('should return 404 when instance not found', async () => {
      service.clearCompletedItems.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await testRequest
        .post('/checklist-instances/non-existent/clear-completed-items')
        .expect(404);
    });
  });

  describe('PUT /checklist-instances/:instanceId', () => {
    it('should return 204 with no response body on success', async () => {
      service.replace.mockResolvedValue(undefined);

      const response = await testRequest
        .put('/checklist-instances/456')
        .send({ title: 'Updated Title', items: [{ title: 'Updated Item' }] })
        .expect(204);

      expect(service.replace).toHaveBeenCalledWith(
        '456',
        { title: 'Updated Title', items: [{ title: 'Updated Item' }] },
        expect.any(Object),
      );
      expect(response.body).toEqual({});
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.replace.mockImplementation(
        (_id: string, _dto: unknown, ability: AppAbility) => {
          ForbiddenError.from(ability).throwUnlessCan(
            'update',
            subject('ChecklistInstance', { createdBy: 'other-user' }),
          );
        },
      );

      await testRequest
        .put('/checklist-instances/456')
        .send({ title: 'Updated Title', items: [{ title: 'Updated Item' }] })
        .expect(403);
    });

    it('should return 404 when instance not found', async () => {
      service.replace.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await testRequest
        .put('/checklist-instances/non-existent')
        .send({ title: 'Title', items: [] })
        .expect(404);
    });

    it('should return 400 when title is missing', async () => {
      await testRequest
        .put('/checklist-instances/456')
        .send({ items: [] })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });

    it('should return 400 when items is missing', async () => {
      await testRequest
        .put('/checklist-instances/456')
        .send({ title: 'Title' })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });

    it('should return 400 when an item title is missing', async () => {
      await testRequest
        .put('/checklist-instances/456')
        .send({ title: 'Title', items: [{ name: 'item-1' }] })
        .expect(400);

      expect(service.replace).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /checklist-instances/:instanceId', () => {
    it('should remove instance and return 200 status', async () => {
      service.remove.mockResolvedValue(undefined);

      await testRequest.delete('/checklist-instances/456').expect(200);

      expect(service.remove).toHaveBeenCalledWith('456', expect.any(Object));
    });

    it('should return 403 when instance belongs to another user', async () => {
      service.remove.mockImplementation((_id: string, ability: AppAbility) => {
        ForbiddenError.from(ability).throwUnlessCan(
          'delete',
          subject('ChecklistInstance', { createdBy: 'other-user' }),
        );
      });

      await testRequest.delete('/checklist-instances/456').expect(403);
    });

    it('should return 404 when instance not found', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await testRequest.delete('/checklist-instances/non-existent').expect(404);

      expect(service.remove).toHaveBeenCalledWith(
        'non-existent',
        expect.any(Object),
      );
    });
  });

  describe('POST /checklist-instances/:instanceId/add-item', () => {
    it('should return 200 with instance and HATEOAS links', async () => {
      service.addItem.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [
          {
            id: 'new-item',
            title: 'New Item',
            description: 'New Description',
            completed: null,
          },
        ],
      });

      const response = await testRequest
        .post('/checklist-instances/456/add-item')
        .send({ title: 'New Item', description: 'New Description' })
        .expect(200);

      expect(service.addItem).toHaveBeenCalledWith(
        '456',
        {
          title: 'New Item',
          description: 'New Description',
        },
        expect.any(Function),
      );
      expect((response.body as Record<string, unknown>).id).toBe('456');
      expect((response.body as Record<string, unknown>).title).toBe(
        'My Instance',
      );
      expect((response.body as Record<string, unknown>)._links).toBeDefined();
      expect(response.body).toHaveProperty('_links.create-from', {
        name: 'checklist',
        href: 'http://api.example.test/my/checklist-instances/456/create-checklist',
      });
    });

    it('should add item with title only', async () => {
      service.addItem.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'My Instance',
        items: [{ id: 'new-item', title: 'New Item', completed: null }],
      });

      const response = await testRequest
        .post('/checklist-instances/456/add-item')
        .send({ title: 'New Item' })
        .expect(200);

      expect(service.addItem).toHaveBeenCalledWith(
        '456',
        {
          title: 'New Item',
        },
        expect.any(Function),
      );
      expect((response.body as Record<string, unknown>).id).toBe('456');
    });

    it('should return 400 when title is missing', async () => {
      await testRequest
        .post('/checklist-instances/456/add-item')
        .send({ description: 'Just a description' })
        .expect(400);

      expect(service.addItem).not.toHaveBeenCalled();
    });

    it('should return 404 when instance not found', async () => {
      service.addItem.mockRejectedValue(
        new NotFoundException('Checklist instance not found'),
      );

      await testRequest
        .post('/checklist-instances/non-existent/add-item')
        .send({ title: 'New Item' })
        .expect(404);

      expect(service.addItem).toHaveBeenCalledWith(
        'non-existent',
        {
          title: 'New Item',
        },
        expect.any(Function),
      );
    });
  });
});
