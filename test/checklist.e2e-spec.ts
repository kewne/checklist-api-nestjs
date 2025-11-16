import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@app/app.module';
import { ChecklistService } from '@app/checklist/checklist.service';
import { Checklist } from '@app/checklist/checklist.entity';
import { title } from 'process';

describe('ChecklistController (e2e)', () => {
  let app: INestApplication<App>;
  const service = {
    create(): Checklist {
      const checklist = new Checklist();
      checklist.id = 123;
      return checklist;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChecklistService)
      .useValue(service)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('can get the checklist data after creating', async () => {
    const createChecklistDto = {
      title: 'Test Checklist for Retrieval',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/checklists')
      .send(createChecklistDto)
      .expect(201)
      .expect('location', '/checklists/123');

    request(app.getHttpServer())
      .get(createResponse.headers.location)
      .send()
      .expect(200)
      .expect({
        title: createChecklistDto.title,
      });
  });
});
