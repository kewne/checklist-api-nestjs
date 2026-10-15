import { Controller, Get, Res } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationConfig, Reflector } from '@nestjs/core';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'express';
import { testRequest as createTestRequest } from '../test/http-request';
import { PlainResource, LinkObject } from './hateoas';
import {
  EnricherRegistry,
  Hateoas,
  NestLinkFactory,
  NestResourceBuilder,
  ResourceLinkEnricher,
  toHandlerCall,
} from './hateoas-nest';
import { HateoasModule } from './hateoas/hateoas.module';

interface TestMap {
  'test-resource': { id: string };
}

describe('NestResourceBuilder', () => {
  const createBuilder = <W extends object>(
    resourceKey?: string,
    enrichers?: EnricherRegistry,
  ): NestResourceBuilder<W> =>
    new NestResourceBuilder<W>(
      'http://localhost',
      'http://localhost/test-resources/1',
      new Reflector(),
      new RoutePathFactory(new ApplicationConfig()),
      resourceKey,
      enrichers,
    );

  it('does not enrich when no resource key is given', () => {
    const enrich = jest.fn();
    const builder = createBuilder<{ id: string }>(undefined, {
      'test-resource': [enrich],
    });

    const resource = builder.toResource({ id: '1' });

    expect(enrich).not.toHaveBeenCalled();
    expect(resource._links).toEqual({
      self: { href: 'http://localhost/test-resources/1' },
    });
  });

  it('runs registered enrichers with the builder and wrapped entity', () => {
    const enrich: ResourceLinkEnricher<TestMap, 'test-resource'> = (
      builder,
      resource,
    ) => {
      builder.withRel('docs', { href: `/docs/${resource.id}` });
    };
    const builder = createBuilder<TestMap['test-resource']>('test-resource', {
      'test-resource': [enrich],
    });

    const resource = builder.toResource({ id: '1' });

    expect(resource._links.docs).toEqual({
      href: 'http://localhost/docs/1',
    });
  });

  it('runs multiple enrichers in registration order', () => {
    const order: string[] = [];
    const first = jest.fn(() => {
      order.push('first');
    });
    const second = jest.fn(() => {
      order.push('second');
    });
    const builder = createBuilder<TestMap['test-resource']>('test-resource', {
      'test-resource': [first, second],
    });

    builder.toResource({ id: '1' });

    expect(order).toEqual(['first', 'second']);
  });

  it('is a no-op when the key has no registered enrichers', () => {
    const builder = createBuilder<TestMap['test-resource']>(
      'test-resource',
      {},
    );

    const resource = builder.toResource({ id: '1' });

    expect(resource._links).toEqual({
      self: { href: 'http://localhost/test-resources/1' },
    });
  });

  it('keeps call-site links alongside enriched links', () => {
    const enrich: ResourceLinkEnricher<TestMap, 'test-resource'> = (b) => {
      b.withRel('docs', { href: '/docs' });
    };
    const builder = createBuilder<TestMap['test-resource']>('test-resource', {
      'test-resource': [enrich],
    });

    const resource = builder
      .withRel('related', { href: '/related' })
      .toResource({ id: '1' });

    expect(resource._links.related).toEqual({
      href: 'http://localhost/related',
    });
    expect(resource._links.docs).toEqual({ href: 'http://localhost/docs' });
  });
});

describe('HATEOAS (HTTP)', () => {
  @Controller('test-resources')
  class TestResourceController {
    @Get()
    findAll() {
      return [];
    }

    @Get('location/plain')
    setPlainLocation(
      @Res({ passthrough: true }) response: Response,
      @Hateoas() linkFactory: NestLinkFactory,
    ) {
      response.statusCode = 202;
      response.setHeader('location', '/previous');
      linkFactory.setLocation(
        toHandlerCall({ controller: TestResourceController }).findAll({}),
      );
      return { accepted: true };
    }

    @Get('location/parameterized')
    setParameterizedLocation(@Hateoas() linkFactory: NestLinkFactory) {
      linkFactory.setLocation(
        toHandlerCall({ controller: TestResourceController }).findOne({
          params: { id: 42 },
        }),
      );
    }

    @Get('location/query')
    setQueryLocation(@Hateoas() linkFactory: NestLinkFactory) {
      linkFactory.setLocation(
        toHandlerCall({
          controller: TestResourceController,
          name: 'resource',
          title: 'Test resource',
        }).findOne({
          params: { id: 'abc' },
          query: { base: 'a+b/c=', search: 'milk & bread' },
        }),
      );
    }

    @Get(':id')
    findOne(@Hateoas() linkFactory: NestLinkFactory<TestMap>) {
      return linkFactory.buildResource('test-resource').toResource({ id: '1' });
    }
  }

  let app: NestExpressApplication;
  let testRequest: ReturnType<typeof createTestRequest>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HateoasModule.registerEnrichers<TestMap>({
          'test-resource': [
            (builder, resource) => {
              builder.withRel('docs', { href: `/docs/${resource.id}` });
            },
          ],
        }),
      ],
      controllers: [TestResourceController],
    }).compile();

    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
    testRequest = createTestRequest(app.getHttpServer());
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('enriches the response with links registered for the resource key', async () => {
    const response = await testRequest.get('/test-resources/1').expect(200);

    const resource = response.body as PlainResource;
    const docs = resource._links.docs as LinkObject;

    expect(docs).toEqual({
      href: 'http://api.example.test/docs/1',
    });
  });

  it('sets an absolute Location, replacing the old header without changing status or body', async () => {
    const response = await testRequest
      .get('/test-resources/location/plain')
      .expect(202);

    expect(response.headers.location).toBe(
      'http://api.example.test/test-resources',
    );
    expect(response.body).toEqual({ accepted: true });
  });

  it('substitutes numeric route parameters in Location', async () => {
    const response = await testRequest
      .get('/test-resources/location/parameterized')
      .expect(200);

    expect(response.headers.location).toBe(
      'http://api.example.test/test-resources/42',
    );
  });

  it('substitutes string parameters and encodes query values without link metadata', async () => {
    const response = await testRequest
      .get('/test-resources/location/query')
      .expect(200);

    expect(response.headers.location).toBe(
      'http://api.example.test/test-resources/abc?base=a%2Bb%2Fc%3D&search=milk+%26+bread',
    );
  });
});
