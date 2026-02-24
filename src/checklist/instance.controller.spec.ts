import { Test, TestingModule } from '@nestjs/testing';
import { InstanceController } from './instance.controller';
import { InstanceService } from './instance.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

describe('InstanceController', () => {
  let app: NestExpressApplication;
  const service = {
    createInstance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [InstanceController],
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
    if (app) {
      await app.close();
    }
  });

  describe('POST /checklists/:id/instances', () => {
    it('should create instance and return 201 with location header', async () => {
      const createDto: CreateChecklistInstanceDto = { name: 'Test Instance' };

      service.createInstance.mockResolvedValue({
        id: '456',
        checklistId: '123',
        name: 'Test Instance',
      });

      const response = await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send(createDto)
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith('123', createDto);
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should create instance without name and return 201 with location header', async () => {
      const createDto: CreateChecklistInstanceDto = {};

      service.createInstance.mockResolvedValue({
        id: '456',
        checklistId: '123',
      });

      const response = await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send(createDto)
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith('123', createDto);
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should return 404 when checklist does not exist', async () => {
      const createDto: CreateChecklistInstanceDto = { name: 'Test Instance' };

      service.createInstance.mockImplementation(() => {
        throw new NotFoundException('Checklist not found');
      });

      await request(app.getHttpServer())
        .post('/checklists/999/instances')
        .send(createDto)
        .expect(404);

      expect(service.createInstance).toHaveBeenCalledWith('999', createDto);
    });
  });
});
