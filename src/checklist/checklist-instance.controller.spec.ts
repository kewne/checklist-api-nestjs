import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { InstanceService } from './instance.service';
import { NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { Request, Response, NextFunction } from 'express';

describe('ChecklistInstanceController', () => {
  let app: NestExpressApplication;
  const service = {
    createInstance: jest.fn(),
    findOne: jest.fn(),
  };
  const mockUser: AuthUser = { uid: 'test-user-id' };

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

    // Middleware to inject mock user into request
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
    jest.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  describe('POST /checklist-instances', () => {
    it('should create instance with provided title and return 201 with location header', async () => {
      service.createInstance.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        title: 'My Title',
        items: [],
      });

      const response = await request(app.getHttpServer())
        .post('/checklist-instances?checklist_id=123')
        .send({ title: 'My Title' })
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith(
        '123',
        'test-user-id',
        'My Title',
      );
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should create instance without title and return 201 with location header', async () => {
      service.createInstance.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        title: 'My Checklist - 2026-04-19T00:00:00.000Z',
        items: [],
      });

      const response = await request(app.getHttpServer())
        .post('/checklist-instances?checklist_id=123')
        .send({})
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith(
        '123',
        'test-user-id',
        undefined,
      );
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should return 404 when checklist does not exist', async () => {
      service.createInstance.mockImplementation(() => {
        throw new NotFoundException('Checklist not found');
      });

      await request(app.getHttpServer())
        .post('/checklist-instances?checklist_id=999')
        .send({})
        .expect(404);

      expect(service.createInstance).toHaveBeenCalledWith(
        '999',
        'test-user-id',
        undefined,
      );
    });
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
      expect((response.body as Record<string, unknown>).title).toBe('My Instance');
      expect((response.body as Record<string, unknown>)._links).toBeDefined();
      const links = (response.body as Record<string, unknown>)._links as Record<string, unknown>;
      expect(links.self).toBeDefined();
      expect(links.checklist).toBeDefined();
      const checklistLink = links.checklist as Record<string, unknown>;
      expect((checklistLink.href as string)).toMatch(/\/checklists\/123$/);
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
});
