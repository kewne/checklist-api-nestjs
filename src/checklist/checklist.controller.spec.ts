import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { PlainResource, LinkObject } from '@app/hateoas';

describe('ChecklistController', () => {
  let app: NestExpressApplication;
  let serviceMock: jest.Mocked<Omit<ChecklistService, 'repository'>>;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

  describe('POST /checklists', () => {
    it('should create a checklist and return 201 with location header', async () => {
      // Arrange
      const createDto: CreateChecklistDto = { title: 'Test Checklist' };
      const createdChecklist = {
        id: '123',
        title: createDto.title,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      serviceMock.create.mockResolvedValue(createdChecklist);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/checklists')
        .send(createDto)
        .expect(201);

      expect(serviceMock.create).toHaveBeenCalledWith(createDto);
      expect(response.headers['location']).toMatch(/\/checklists\/123$/);
    });
  });

  describe('GET /checklists', () => {
    it('should return all checklists with 200 status', async () => {
      // Arrange
      const checklists = [
        { id: 1, title: 'Checklist 1' },
        { id: 2, title: 'Checklist 2' },
      ];
      (serviceMock.findAll as jest.Mock).mockResolvedValue(checklists);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/checklists')
        .expect(200);

      expect(serviceMock.findAll).toHaveBeenCalled();
      expect(response.body).toEqual(checklists);
    });
  });

  describe('GET /checklists/:id', () => {
    it('should return a checklist with HATEOAS links and 200 status when checklist exists', async () => {
      // Arrange
      const checklist = {
        id: '123',
        title: 'Test Checklist for Retrieval',
        createdAt: new Date(),
        updatedAt: new Date()
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

  describe('PATCH /checklists/:id', () => {
    it('should update a checklist and return 200 status', async () => {
      // Arrange
      const updateDto: UpdateChecklistDto = { title: 'Updated Checklist' };
      const updatedChecklist = { id: 123, title: 'Updated Checklist' };

      (serviceMock.update as jest.Mock).mockResolvedValue(updatedChecklist);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .patch('/checklists/123')
        .send(updateDto)
        .expect(200);

      expect(serviceMock.update).toHaveBeenCalledWith('123', updateDto);
      expect(response.body).toEqual(updatedChecklist);
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
});
