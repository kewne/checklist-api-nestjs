import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { ChecklistService } from '@app/checklist/checklist.service';
import { Checklist } from '@app/checklist/checklist.entity';
import { NestExpressApplication } from '@nestjs/platform-express';
import { LinkObject, PlainResource } from '@app/hateoas';

describe('ChecklistController (e2e)', () => {
  let app: NestExpressApplication;
  const service = {
    create(): Checklist {
      const checklist = new Checklist();
      checklist.id = 123;
      return checklist;
    },
    findOne(id: number): Checklist | null {
      if (id === 123) {
        const checklist = new Checklist();
        checklist.id = 123;
        checklist.title = 'Test Checklist for Retrieval';
        return checklist;
      }
      return null;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChecklistService)
      .useValue(service)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
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
      .send(createChecklistDto);

    expect(createResponse.statusCode).toBe(201);

    expect(createResponse.headers['location']).toMatch(
      absoluteServerUrl('/checklists/123'),
    );

    request(app.getHttpServer())
      .get(createResponse.headers.location)
      .send()
      .expect(200)
      .expect({
        title: createChecklistDto.title,
      });
  });

  it('returns a Resource with HATEOAS links when getting a checklist by id', async () => {
    const response = await request(app.getHttpServer())
      .get('/checklists/123')
      .expect(200);
    const responseJson = response.body as PlainResource;

    expect(responseJson).not.toHaveProperty('id');
    expect(responseJson).toHaveProperty(
      'title',
      'Test Checklist for Retrieval',
    );
    expect(response.body).toHaveProperty('_links');
    expect(responseJson._links).toHaveProperty('self');
    expect(Array.isArray(responseJson._links['self']));
    const selfRel = responseJson._links['self'] as LinkObject;
    expect(selfRel).toHaveProperty('href');
    expect(selfRel.href).toMatch(absoluteServerUrl('/checklists/123'));
  });
});
function absoluteServerUrl(relative: string): RegExp {
  return new RegExp(`^http://127\\.0\\.0\\.1:\\d+${RegExp.escape(relative)}$`);
}
