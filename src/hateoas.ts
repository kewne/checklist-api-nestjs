import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

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
    link = {
      name: link?.name,
      href: new URL(link.href, this.baseUrl).toString(),
    };
    const current = this.links[rel];
    if (current) {
      if (Array.isArray(current)) {
        current.push(link);
      } else {
        this.links[rel] = [current, link];
      }
    } else {
      this.links[rel] = link;
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
