type Wrapped = Record<string, any>;

type JsonHal<T extends Wrapped> = T & {
  _links: { [rel: string]: { href: string } };
  _embedded?: { [key: string]: any };
};

export class Resource<T extends Wrapped> {
  private obj: JsonHal<T>;

  constructor(obj: JsonHal<T>) {
    this.obj = obj;
  }
}
