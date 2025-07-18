type Wrapped = Record<string, any>;

type LinkObject = { href: string };
type JsonHal<T extends Wrapped> = T & {
  _links: { [rel: string]: LinkObject | LinkObject[] };
};

export class Resource<T extends Wrapped> {
  private obj: JsonHal<T>;

  constructor(obj: JsonHal<T>) {
    this.obj = obj;
  }
}
