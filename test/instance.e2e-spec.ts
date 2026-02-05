import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { LinkObject } from '@app/hateoas';

describe('InstanceController (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    it('should create a checklist instance and return location header', async () => {
      // First create a checklist
      const createChecklistDto = {
        title: 'Test Checklist for Instance',
      };

      const checklistResponse = await request(app.getHttpServer())
        .post('/checklists')
        .send(createChecklistDto)
        .expect(201);

      const checklistUrl = new URL(checklistResponse.headers['location']);
      const getChecklistResponse = await request(app.getHttpServer())
        .get(checklistUrl.pathname + checklistUrl.search)
        .expect(200);

      const instancesLink: LinkObject =
        getChecklistResponse.body._links.instances;

      // Convert absolute URL to relative URL
      const instancesUrl = new URL(instancesLink.href);

      // Now create an instance using the HATEOAS link
      const createInstanceDto = {
        name: 'Test Instance',
      };

      const instanceResponse = await request(app.getHttpServer())
        .post(instancesUrl.pathname)
        .send(createInstanceDto)
        .expect(201);

      expect(instanceResponse.headers['location']).toMatch(
        new RegExp(`^http://127\.0\.0\.1:\d+/checklist-instances/\d+$`),
      );

      // Verify the relative URL format
      const locationUrl = new URL(instanceResponse.headers['location']);
      expect(locationUrl.pathname).toMatch(
        new RegExp(`^/checklists/\\d+/instances/\\d+$`),
      );
    });

    it('should create a checklist instance without name', async () => {
      // First create a checklist
      const createChecklistDto = {
        title: 'Test Checklist for Instance Without Name',
      };

      const checklistResponse = await request(app.getHttpServer())
        .post('/checklists')
        .send(createChecklistDto)
        .expect(201);

      // Get the created checklist to access HATEOAS links
      const checklistUrl = new URL(checklistResponse.headers['location']);
      const getChecklistResponse = await request(app.getHttpServer())
        .get(checklistUrl.pathname + checklistUrl.search)
        .expect(200);

      const instancesLink: LinkObject =
        getChecklistResponse.body._links.instances;

      // Convert absolute URL to relative URL
      const instancesUrl = new URL(instancesLink.href);

      // Now create an instance without name using the HATEOAS link
      const createInstanceDto = {};

      const instanceResponse = await request(app.getHttpServer())
        .post(instancesUrl.pathname)
        .send(createInstanceDto)
        .expect(201);

      expect(instanceResponse.headers['location']).toMatch(
        new RegExp(`^http://127\\.0\\.0\\.1:\\d+/checklist-instances/\\d+$`),
      );

      // Verify the relative URL format
      const locationUrl = new URL(instanceResponse.headers['location']);
      expect(locationUrl.pathname).toMatch(
        new RegExp(`^/checklist-instances/\\d+$`),
      );
    });

    it('should return 404 when checklist does not exist', async () => {
      const createInstanceDto = {
        name: 'Test Instance',
      };

      await request(app.getHttpServer())
        .post('/checklists/999/instances')
        .send(createInstanceDto)
        .expect(404);
    });
  });
});
