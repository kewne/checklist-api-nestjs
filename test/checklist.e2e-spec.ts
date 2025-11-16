import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ChecklistController (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

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

        // Create a checklist first
        const createResponse = await request(app.getHttpServer())
            .post('/checklists')
            .send(createChecklistDto)
            .expect(201);

        const createdChecklist = createResponse.body as { id: number; title: string };
        const locationHeader = createResponse.headers.location;

        expect(createdChecklist.id).toBeDefined();
        expect(createdChecklist.title).toBe(createChecklistDto.title);
        expect(locationHeader).toBe(`/checklists/${createdChecklist.id}`);

        // Then retrieve it using the Location header
        return request(app.getHttpServer())
            .get(locationHeader)
            .expect(200)
            .expect({
                id: createdChecklist.id,
                title: createChecklistDto.title,
            });
    })

    describe('/checklists (POST)', () => {
        it('should create a new checklist', () => {
            const createChecklistDto = {
                title: 'Test Checklist',
            };

            return request(app.getHttpServer())
                .post('/checklists')
                .send(createChecklistDto)
                .expect(201)
                .expect('Location', /\/checklists\/\d+/);
        });

    });
});
