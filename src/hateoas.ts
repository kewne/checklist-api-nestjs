type Wrapped = Record<string, any>;

export type LinkObject = { href: string } & LinkOptions;
export type LinkOptions = {
  name?: string;
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
  withRel(rel: string, ...links: LinkObject[]): this;
  toResource<T extends Wrapped>(wrapped: T): Resource<T>;
}

export class BaseUrlResourceBuilder implements ResourceBuilder {
  private links: { [rel: string]: LinkObject | LinkObject[] } = {};
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
        current.push(link);
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
  toResource<T extends Wrapped>(wrapped?: T): Resource<T> {
    return new Resource(this.links, wrapped);
  }
}
