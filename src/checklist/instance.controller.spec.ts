import { Test, TestingModule } from '@nestjs/testing';
import { InstanceController } from './instance.controller';
import { InstanceService } from './instance.service';
import { ChecklistInstance } from './checklist-instance.entity';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

/* eslint-disable @typescript-eslint/unbound-method */

describe('InstanceController', () => {
  let app: NestExpressApplication;
  let service: InstanceService;

  beforeEach(async () => {
    const serviceMock = {
      createInstance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [InstanceController],
      providers: [
        {
          provide: InstanceService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    service = module.get<InstanceService>(InstanceService);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /checklists/:id/instances', () => {
    it('should create instance and return 201 with location header', async () => {
      // Arrange
      const createDto: CreateChecklistInstanceDto = { name: 'Test Instance' };
      const createdInstance = new ChecklistInstance();
      createdInstance.id = 456;
      createdInstance.checklistId = 123;
      createdInstance.name = 'Test Instance';

      jest.spyOn(service, 'createInstance').mockResolvedValue(createdInstance);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send(createDto)
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith(123, createDto);
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should create instance without name and return 201 with location header', async () => {
      // Arrange
      const createDto: CreateChecklistInstanceDto = {};
      const createdInstance = new ChecklistInstance();
      createdInstance.id = 456;
      createdInstance.checklistId = 123;
      createdInstance.name = undefined;

      jest.spyOn(service, 'createInstance').mockResolvedValue(createdInstance);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send(createDto)
        .expect(201);

      expect(service.createInstance).toHaveBeenCalledWith(123, createDto);
      expect(response.headers['location']).toMatch(
        /\/checklist-instances\/456$/,
      );
    });

    it('should return 404 when checklist does not exist', async () => {
      // Arrange
      const createDto: CreateChecklistInstanceDto = { name: 'Test Instance' };

      jest.spyOn(service, 'createInstance').mockImplementation(() => {
        throw new NotFoundException('Checklist not found');
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/checklists/999/instances')
        .send(createDto)
        .expect(404);

      expect(service.createInstance).toHaveBeenCalledWith(999, createDto);
    });
  });
});
