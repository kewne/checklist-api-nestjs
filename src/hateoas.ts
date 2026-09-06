import { Expose } from 'class-transformer';

type Wrapped = object;

export type LinkObject = { href: string } & LinkOptions;
export interface LinkOptions {
  name?: string;
  title?: string;
}
export interface PlainResource {
  _links: Record<string, LinkObject | LinkObject[]>;
  [p: string]: unknown;
}

export class Resource<T extends Wrapped = Record<string, never>> {
  private wrapped?: T;
  @Expose({ name: '_links' })
  private links: Record<string, LinkObject | LinkObject[]>;

  constructor(links: Record<string, LinkObject | LinkObject[]>, wrapped?: T) {
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
  withRel(rel: string, ...links: LinkObject[]): this;
  toResource(wrapped?: Wrapped): PlainResource;
}

export class BaseUrlResourceBuilder implements ResourceBuilder {
  private links: Record<string, LinkObject | LinkObject[]> = {};
  public constructor(
    private baseUrl: string,
    self: string,
  ) {
    this.addLink('self', { href: self });
  }
  protected addLink(rel: string, link: LinkObject): this {
    const absoluteLink: LinkObject = {
      ...link,
      href: new URL(link.href, this.baseUrl).toString(),
    };
    const current = this.links[rel];
    if (current) {
      if (Array.isArray(current)) {
        current.push(absoluteLink);
      } else {
        this.links[rel] = [current, absoluteLink];
      }
    } else {
      this.links[rel] = absoluteLink;
    }
    return this;
  }
  withRel(rel: string, ...links: LinkObject[]): this {
    links.forEach((link) => this.addLink(rel, link));
    return this;
  }
  toResource(wrapped?: Wrapped): PlainResource {
    return {
      ...wrapped,
      _links: this.links,
    };
  }
}
