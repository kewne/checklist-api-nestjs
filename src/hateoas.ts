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

export type NestedResources = Record<string, PlainResource[]>;

export interface PlainResourceWithNested extends PlainResource {
  _nested?: NestedResources;
}

export class Resource<T extends Wrapped = Record<string, never>> {
  private wrapped?: T;
  @Expose({ name: '_links' })
  private links: Record<string, LinkObject | LinkObject[]>;
  @Expose({ name: '_nested' })
  private nested?: NestedResources;

  constructor(
    links: Record<string, LinkObject | LinkObject[]>,
    wrapped?: T,
    nested?: NestedResources,
  ) {
    this.wrapped = wrapped;
    this.links = links;
    this.nested = nested;
  }

  toJSON() {
    const nonEmptyNested = this.nested
      ? Object.fromEntries(
          Object.entries(this.nested).filter(
            ([, resources]) => resources.length > 0,
          ),
        )
      : undefined;
    return {
      ...(this.wrapped ?? {}),
      _links: this.links,
      ...(nonEmptyNested && Object.keys(nonEmptyNested).length > 0
        ? { _nested: nonEmptyNested }
        : {}),
    };
  }
}

export interface NestedResourceBuilder {
  withRel(rel: string, ...links: LinkObject[]): this;
  toResource(wrapped?: Wrapped): PlainResource;
}

export interface ResourceBuilder {
  withRel(rel: string, ...links: LinkObject[]): this;
  withNested(key: string, ...resources: PlainResource[]): this;
  toResource(wrapped?: Wrapped): PlainResourceWithNested;
}

export class BaseUrlNestedResourceBuilder implements NestedResourceBuilder {
  protected links: Record<string, LinkObject | LinkObject[]> = {};
  public constructor(private baseUrl: string) {}
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

export class BaseUrlResourceBuilder
  extends BaseUrlNestedResourceBuilder
  implements ResourceBuilder
{
  private nested: NestedResources = {};
  public constructor(baseUrl: string, self: string) {
    super(baseUrl);
    this.addLink('self', { href: self });
  }
  withNested(key: string, ...resources: PlainResource[]): this {
    if (resources.length === 0) {
      return this;
    }
    const current = this.nested[key];
    if (current) {
      current.push(...resources);
    } else {
      this.nested[key] = [...resources];
    }
    return this;
  }
  override toResource(wrapped?: Wrapped): PlainResourceWithNested {
    const hasNested = Object.keys(this.nested).length > 0;
    return {
      ...super.toResource(wrapped),
      ...(hasNested ? { _nested: this.nested } : {}),
    };
  }
}
