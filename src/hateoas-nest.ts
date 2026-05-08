import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ApplicationConfig, ModuleRef, Reflector } from '@nestjs/core';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { Request } from 'express';
import { BaseUrlResourceBuilder, LinkObject, LinkOptions } from './hateoas';
import { MODULE_KEY, REFLECTOR_KEY } from './hateoas/hateoas.interceptor';

export const Hateoas = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const reflector = req[REFLECTOR_KEY] as Reflector;
    const module = req[MODULE_KEY] as ModuleRef;
    const config = module.get(ApplicationConfig);
    const routePathFactory = new RoutePathFactory(config);
    return new NestLinkFactory(
      `${req.protocol}://${req.host}`,
      req.url,
      reflector,
      routePathFactory,
    );
  },
);

export class NestLinkFactory {
  constructor(
    private baseUrl: string,
    private selfUrl: string,
    private reflector: Reflector,
    private routePathFactory: RoutePathFactory,
  ) {}

  public buildResource(): NestResourceBuilder {
    return new NestResourceBuilder(
      this.baseUrl,
      this.selfUrl,
      this.reflector,
      this.routePathFactory,
    );
  }

  public toHandler<C>(
    controller: Type<C>,
    handler: ClassMethodName<C>,
    options?: {
      params?: Record<string, string | number>;
      query?: Record<string, string>;
    },
  ): string {
    const { params, query } = options ?? {};
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

    return url.toString();
  }

  public toAbsolute(relativePath: string): LinkObject {
    return {
      href: new URL(relativePath, this.baseUrl).toString(),
    };
  }
}

export type MethodsOnly<C> = {
  [Property in keyof C as C[Property] extends (...args: never[]) => void
    ? Property
    : never]: C[Property];
};

export type ClassMethodName<C> = keyof MethodsOnly<C>;

declare const __handlerLink: unique symbol;
type HandlerLink = Omit<LinkObject, 'href'> & {
  [__handlerLink]: void;
  controller: Type;
  handler: string | number | symbol;
  params?: Record<string, string | number>;
  query?: Record<string, string>;
};

export function toHandler<C>(
  controller: Type<C>,
  handler: ClassMethodName<C>,
  options?: LinkOptions & {
    params?: Record<string, string | number>;
    query?: Record<string, string>;
  },
): HandlerLink {
  return {
    ...options,
    controller,
    handler,
  } as HandlerLink;
}

export class NestResourceBuilder extends BaseUrlResourceBuilder {
  constructor(
    baseUrl: string,
    selfUrl: string,
    private reflector: Reflector,
    private routePathFactory: RoutePathFactory,
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
}
