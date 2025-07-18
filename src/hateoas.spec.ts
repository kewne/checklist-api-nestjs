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

  it('should construct Resource with only _links and no extra properties', () => {
    const resource = new Resource({
      _links: {
        self: { href: '/resource/empty' }
      }
    });
    expect(resource).toBeInstanceOf(Resource);
  });
});
