import { Test, TestingModule } from '@nestjs/testing';
import { CreateInstanceController } from './create-instance.controller';
import { InstanceService } from './instance.service';
import { NotFoundException } from '@nestjs/common';
import { HateoasModule } from '../hateoas/hateoas.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { USER_AUTH_KEY } from '@app/auth/auth.constants';
import { AuthUser } from '@app/auth/auth.guard';
import { Request, Response, NextFunction } from 'express';

describe('CreateInstanceController', () => {
  let app: NestExpressApplication;
  const service = {
    createInstance: jest.fn(),
  };
  const mockUser: AuthUser = { uid: 'test-user-id' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
      controllers: [CreateInstanceController],
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

  describe('POST /checklists/:id', () => {
    it('should create instance with provided title and return 201 with location header', async () => {
      service.createInstance.mockResolvedValue({
        id: '456',
        checklistId: '123',
        createdBy: 'test-user-id',
        title: 'My Title',
        items: [],
      });

      const response = await request(app.getHttpServer())
        .post('/checklists/123')
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
        .post('/checklists/123')
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
        .post('/checklists/999')
        .send({})
        .expect(404);

      expect(service.createInstance).toHaveBeenCalledWith(
        '999',
        'test-user-id',
        undefined,
      );
    });
  });
});
