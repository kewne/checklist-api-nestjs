import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { NestResourceBuilder } from './hateoas-nest';
import { Reflector } from '@nestjs/core';

describe('AppController', () => {
  let appController: AppController;
  let reflector: Reflector;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get(AppController);
    reflector = app.get(Reflector);
  });

  describe('root', () => {
    it('should return resource with self link', () => {
      expect(
        appController
          .root(new NestResourceBuilder('http://example.com', '/', reflector))
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
