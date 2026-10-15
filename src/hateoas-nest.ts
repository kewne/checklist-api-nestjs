import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ApplicationConfig, ModuleRef, Reflector } from '@nestjs/core';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { Request, Response } from 'express';
import {
  BaseUrlResourceBuilder,
  LinkObject,
  LinkOptions,
  PlainResource,
} from './hateoas';
import { MODULE_KEY, REFLECTOR_KEY } from './hateoas/hateoas.interceptor';

export const RESOURCE_ENRICHER_REGISTRY = Symbol('RESOURCE_ENRICHER_REGISTRY');

export const Hateoas = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const reflector = req[REFLECTOR_KEY] as Reflector;
    const module = req[MODULE_KEY] as ModuleRef;
    const config = module.get(ApplicationConfig);
    const routePathFactory = new RoutePathFactory(config);
    const enrichers = module.get<EnricherRegistry>(RESOURCE_ENRICHER_REGISTRY);
    return new NestLinkFactory(
      ctx.switchToHttp().getResponse<Response>(),
      `${req.protocol}://${req.host}`,
      req.url,
      reflector,
      routePathFactory,
      enrichers,
    );
  },
);

export type ResourceMap = object;

export class NestLinkFactory<M extends ResourceMap = never> {
  constructor(
    private response: Response,
    private baseUrl: string,
    private selfUrl: string,
    private reflector: Reflector,
    private routePathFactory: RoutePathFactory,
    private enrichers?: EnricherRegistry,
  ) {}

  public buildResource<K extends keyof M>(
    resourceKey?: K,
  ): NestResourceBuilder<M[K] & object> {
    return new NestResourceBuilder<M[K] & object>(
      this.baseUrl,
      this.selfUrl,
      this.reflector,
      this.routePathFactory,
      resourceKey,
      this.enrichers,
    );
  }

  public setLocation(link: HandlerLink): void {
    const { controller, handler, params, query } = link;
    const [href] = this.routePathFactory.create({
      ctrlPath: this.reflector.get<string | undefined>(
        PATH_METADATA,
        controller,
      ),
      methodPath: this.reflector.get<string | undefined>(
        PATH_METADATA,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        controller.prototype[handler],
      ),
    });
    if (typeof handler === 'number') {
      throw new Error();
    }

    // Replace route parameters in the href
    let finalHref = href;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalHref = finalHref.replace(`:${key}`, String(value));
      });
    }

    const url = new URL(finalHref, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    this.response.setHeader('location', url.toString());
  }
}

declare const __handlerLink: unique symbol;
type HandlerLink = Omit<LinkObject, 'href'> & {
  [__handlerLink]: void;
  controller: Type;
  handler: string | number | symbol;
  params?: Record<string, string | number>;
  query?: Record<string, string>;
};

type ProxiedCalls<C> = {
  [Property in keyof C]: C[Property] extends (...args: infer ARGS) => unknown
    ? (args: Pick<HandlerLink, 'params' | 'query'>) => HandlerLink
    : never;
};

export type OneLessTuple<C extends unknown[]> = C extends [
  ...infer OTHER,
  unknown,
]
  ? C | OTHER | OneLessTuple<OTHER>
  : never;

export function toHandlerCall<C>(
  options: LinkOptions & {
    controller: Type<C>;
  },
): ProxiedCalls<C> {
  return new Proxy({} as ProxiedCalls<C>, {
    get(target, p: string | symbol): () => HandlerLink {
      return (args?: Pick<HandlerLink, 'params' | 'query'>) =>
        ({
          ...options,
          params: args?.params,
          query: args?.query,
          handler: p,
        }) as HandlerLink;
    },
  });
}

export type ResourceLinkEnricher<M extends ResourceMap, K extends keyof M> = (
  builder: NestResourceBuilder<M[K] & object>,
  resource: M[K],
) => void;

type AnyResourceLinkEnricher = (
  builder: NestResourceBuilder<object>,
  resource: unknown,
) => void;

export type EnricherRegistry<M extends ResourceMap = ResourceMap> = {
  [K in keyof M]?: ResourceLinkEnricher<M, K>[];
};

export class NestResourceBuilder<
  W extends object = object,
> extends BaseUrlResourceBuilder {
  constructor(
    baseUrl: string,
    selfUrl: string,
    private reflector: Reflector,
    private routePathFactory: RoutePathFactory,
    private resourceKey?: string | number | symbol,
    private enrichers?: EnricherRegistry,
  ) {
    super(baseUrl, selfUrl);
  }

  private addLinkToHandler(rel: string, options: HandlerLink): this {
    const { controller, handler, params, query, ...linkProps } = options;
    const [href] = this.routePathFactory.create({
      ctrlPath: this.reflector.get<string | undefined>(
        PATH_METADATA,
        controller,
      ),
      methodPath: this.reflector.get<string | undefined>(
        PATH_METADATA,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        controller.prototype[handler],
      ),
    });

    // Replace route parameters in the href
    let finalHref = href;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalHref = finalHref.replace(`:${key}`, String(value));
      });
    }

    if (query) {
      const queryStr = new URLSearchParams(query).toString();
      finalHref = finalHref + (queryStr ? '?' + queryStr : '');
    }

    const linkObj: LinkObject = {
      ...linkProps,
      href: finalHref,
    };
    return this.addLink(rel, linkObj);
  }

  withRel(rel: string, ...links: (LinkObject | HandlerLink)[]): this {
    links.forEach((link) => {
      if ('href' in link) {
        return super.addLink(rel, link);
      }
      return this.addLinkToHandler(rel, link);
    });
    return this;
  }

  override toResource(wrapped: W | undefined): PlainResource {
    if (this.resourceKey && wrapped !== undefined) {
      const enrichers = this.enrichers?.[this.resourceKey] as
        | AnyResourceLinkEnricher[]
        | undefined;
      enrichers?.forEach((enrich) => enrich(this, wrapped));
    }
    return super.toResource(wrapped);
  }
}
