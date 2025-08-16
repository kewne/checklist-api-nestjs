import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';

type Wrapped = Record<string, any>;

type LinkObject = { href: string; name?: string };
type JsonHal<T extends Wrapped> = T & {
  _links: { [rel: string]: LinkObject | LinkObject[] };
};

export class Resource<T extends Wrapped = any> {
  private wrapped?: T;
  private links: { [rel: string]: LinkObject | LinkObject[] };

  constructor(
    links: { [rel: string]: LinkObject | LinkObject[] },
    wrapped?: T,
  ) {
    this.wrapped = wrapped;
    this.links = links;
  }

  toJSON() {
    return {
      ...(this.wrapped ?? {}),
      _links: this.links,
    };
  }
}

export interface ResourceBuilder {
  addLink(rel: string, link: LinkObject): this;
  toResource<T extends Wrapped>(): Resource<T>;
}

export class BaseUrlResourceBuilder implements ResourceBuilder {
  private links: { [rel: string]: LinkObject | LinkObject[] } = {};
  public constructor(
    private baseUrl: string,
    self: string,
  ) {
    this.addLink('self', { href: self });
  }
  addLink(rel: string, link: LinkObject): this {
    const absoluteLink: LinkObject = {
      href: new URL(link.href, this.baseUrl).toString(),
    };
    if (link.name) {
      absoluteLink.name = link.name;
    }
    const current = this.links[rel];
    if (current) {
      if (Array.isArray(current)) {
        current.push(link);
      } else {
        this.links[rel] = [current, absoluteLink];
      }
    } else {
      this.links[rel] = absoluteLink;
    }
    return this;
  }
  toResource<T extends Wrapped>(wrapped?: T): Resource<T> {
    return new Resource(this.links, wrapped);
  }
}

export const LinkRegistration = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ResourceBuilder => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return new BaseUrlResourceBuilder(`${req.protocol}://${req.host}`, req.url);
  },
);

type MaybeHandlerFunction<C> = {
  [H in keyof C]-?: C[H] extends (...args: never) => unknown ? H : never;
}[keyof C];

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
