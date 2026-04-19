import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { InstanceService } from './instance.service';
import { NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

describe('ChecklistInstanceController', () => {
  let app: NestExpressApplication;
  const service = {
    findOne: jest.fn(),
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
