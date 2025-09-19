import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ChecklistController (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('/checklists (POST)', () => {
        it('should create a new checklist', () => {
            const createChecklistDto = {
                title: 'Test Checklist',
                description: 'A test checklist for e2e testing',
            };

            return request(app.getHttpServer())
                .post('/checklists')
                .send(createChecklistDto)
                .expect(201)
                .expect((res: { body: { id: number } }) => {
                    expect(res.body).toHaveProperty('id')
                    res.body.id = 123
                })
                .expect({
                    id: 123,
                    title: createChecklistDto.title,
                    description: createChecklistDto.description,
                });
        });

    });
});
