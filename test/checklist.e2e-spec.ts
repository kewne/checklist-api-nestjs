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
        await app.close();
    });

    describe('/checklists (POST)', () => {
        it('should create a new checklist', () => {
            const createChecklistDto = {
                title: 'Test Checklist',
            };

            return request(app.getHttpServer())
                .post('/checklists')
                .send(createChecklistDto)
                .expect(201)
                .expect({
                    title: createChecklistDto.title,
                });
        });

        it('ignores extraneous properties', () => {
            const createChecklistDto = {
                title: 'Test Checklist',
                description: 'this should be removed'
            };

            return request(app.getHttpServer())
                .post('/checklists')
                .send(createChecklistDto)
                .expect(201)
                .expect((res: { body: { id: number } }) => {
                    res.body.id = 123
                })
                .expect({
                    id: 123,
                    title: createChecklistDto.title,
                });
        });
    });
});
