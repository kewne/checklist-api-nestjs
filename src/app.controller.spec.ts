import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { BaseUrlResourceBuilder } from './hateoas';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return resource with self link', () => {
      expect(
        appController
          .root(new BaseUrlResourceBuilder('http://example.com', '/'))
          .toJSON(),
      ).toEqual({
        _links: {
          self: { href: 'http://example.com/' },
          related: [
            { href: 'http://example.com/hello/hello' },
            { name: 'checklists', href: 'http://example.com/checklists/' },
          ],
        },
      });
    });
  });
});
