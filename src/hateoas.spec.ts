import { Resource, } from './hateoas';

describe('Resource', () => {
  it('should construct Resource with a minimal HAL object', () => {
    const resource = new Resource({
      id: 42,
      _links: {
        self: { href: '/resource/42' },
      },
    });
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with a HAL object containing _embedded', () => {
    const resource = new Resource({
      id: 7,
      name: 'Example',
      _links: {
        self: { href: '/resource/7' },
        related: { href: '/resource/related' }
      },
      _embedded: {
        items: [{ id: 8 }]
      }
    });
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with extra properties', () => {
    const resource = new Resource({
      foo: 'baz',
      bar: 123,
      _links: {
        self: { href: '/resource/extra' }
      }
    });
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with an array of link objects', () => {
    const resource = new Resource({
      id: 99,
      _links: {
        self: [{ href: '/resource/99' }, { href: '/resource/99/alt' }],
        related: { href: '/resource/related' }
      }
    });
    expect(resource).toBeInstanceOf(Resource);
  });
});
