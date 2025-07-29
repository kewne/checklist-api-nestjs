type Wrapped = Record<string, any>;

type LinkObject = { href: string, name?: string };
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
      _links: this.links
    };
  }
}
