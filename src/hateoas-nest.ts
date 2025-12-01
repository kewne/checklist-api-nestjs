import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { Request } from 'express';
import { ApplicationConfig, ModuleRef, Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { BaseUrlResourceBuilder, LinkObject, LinkOptions } from './hateoas';
import { MODULE_KEY, REFLECTOR_KEY } from './hateoas/hateoas.interceptor';

export const Hateoas = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
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
    handler: MaybeHandlerFunction<C>,
    params?: Record<string, string | number>,
  ): string {
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

    return new URL(finalHref, this.baseUrl).toString();
  }
}

export type MaybeHandlerFunction<C> = {
  [H in keyof C]-?: C[H] extends (...args: never) => unknown ? H : never;
}[keyof C];

type HandlerLink<C> = Omit<LinkObject, 'href'> & {
  controller: Type<C>;
  handler: MaybeHandlerFunction<C>;
  params?: Record<string, string | number>;
};

export function toHandler<C>(
  controller: Type<C>,
  handler: MaybeHandlerFunction<C>,
  options?: LinkOptions & { params?: Record<string, string | number> },
): HandlerLink<C> {
  return {
    ...options,
    controller,
    handler,
  };
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

  private addLinkToHandler<C>(rel: string, options: HandlerLink<C>): this {
    const { controller, handler, params, ...linkProps } = options;
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

    const linkObj: LinkObject = {
      ...linkProps,
      href: finalHref,
    };
    return this.addLink(rel, linkObj);
  }

  withRel(rel: string, ...links: (LinkObject | HandlerLink<any>)[]): this {
    links.forEach((link) => {
      if ('href' in link) {
        return super.addLink(rel, link);
      }
      return this.addLinkToHandler(rel, link);
    });
    return this;
  }
}
