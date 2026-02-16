import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import { InstanceController } from '@app/checklist/instance.controller';
import { InstanceService } from '@app/checklist/instance.service';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { NotFoundException } from '@nestjs/common';

describe('InstanceController (e2e)', () => {
  let app: NestExpressApplication;
  const serviceMock = {
    createInstance: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: InstanceService,
          useValue: serviceMock,
        },
      ],
      controllers: [InstanceController],
      imports: [HateoasModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Instance Creation', () => {
    it('returns a location header', async () => {
      serviceMock.createInstance.mockReturnValue({
        id: 123,
      });
      await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send({
          title: 'Test Checklist for Instance',
        })
        .expect(201)
        .expect(
          'location',
          new RegExp('http://127.0.0.1:\\d+/checklist-instances/123'),
        );
    });

    it('should create a checklist instance without name', async () => {
      await request(app.getHttpServer())
        .post('/checklists/123/instances')
        .send({})
        .expect(201);
    });

    it('should return 404 when checklist does not exist', async () => {
      serviceMock.createInstance.mockImplementation(() => {
        throw new NotFoundException('');
      });
      await request(app.getHttpServer())
        .post('/checklists/999/instances')
        .send({
          name: 'Test Instance',
        })
        .expect(404);
    });
  });
});
