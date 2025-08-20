import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { Request } from 'express';
import { ApplicationConfig, ModuleRef, Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { BaseUrlResourceBuilder, LinkObject, LinkOptions } from './hateoas';
import { MODULE_KEY, REFLECTOR_KEY } from './hateoas/hateoas.interceptor';

export const LinkRegistration = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const reflector = req[REFLECTOR_KEY] as Reflector;
    const module = req[MODULE_KEY] as ModuleRef;
    const config = module.get(ApplicationConfig);
    const routePathFactory = new RoutePathFactory(config);
    return new NestResourceBuilder(
      `${req.protocol}://${req.host}`,
      req.url,
      reflector,
      routePathFactory,
    );
  },
);

export type MaybeHandlerFunction<C> = {
  [H in keyof C]-?: C[H] extends (...args: never) => unknown ? H : never;
}[keyof C];

type HandlerLink<C> = Omit<LinkObject, 'href'> & {
  controller: Type<C>;
  handler: MaybeHandlerFunction<C>;
};

export function extractRouteFromHandler<C>(
  controller: Type<C>,
  handler: MaybeHandlerFunction<C>,
  reflector: Reflector,
): string {
  const controllerPath = reflector.get<string | undefined>(
    PATH_METADATA,
    controller,
  );
  if (controllerPath === undefined) {
    throw new Error('Class is not a controller');
  }
  const methodPath = reflector.get<string | undefined>(
    PATH_METADATA,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    controller.prototype[handler],
  );
  if (methodPath === undefined) {
    throw new Error('Method is not a handler method');
  }
  if (methodPath.startsWith('/')) {
    return `${controllerPath}${methodPath}`;
  }
  return `${controllerPath}/${methodPath}`;
}

export function toHandler<C>(
  controller: Type<C>,
  handler: MaybeHandlerFunction<C>,
  options?: LinkOptions,
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
    const { controller, handler, ...linkProps } = options;
    const href = this.routePathFactory.create({
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
    const linkObj: LinkObject = {
      ...linkProps,
      href: href[0],
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
