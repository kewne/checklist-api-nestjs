import { Resource } from './hateoas';

describe('Resource', () => {
  it('should construct Resource with a minimal HAL links object', () => {
    const resource = new Resource({
      self: { href: '/resource/42' },
    });
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with an array of link objects', () => {
    const resource = new Resource({
      self: [{ href: '/resource/99' }, { href: '/resource/99/alt' }],
      related: { href: '/resource/related' },
    });
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with only self link', () => {
    const resource = new Resource(
      {
        self: [{ href: '/resource/99' }, { href: '/resource/99/alt' }],
        related: { href: '/resource/related' },
      },
      {
        id: 99,
      },
    );
    expect(resource).toBeInstanceOf(Resource);
  });

  it('should construct Resource with only _links and no extra properties', () => {
    const resource = new Resource({
      self: { href: '/resource/empty' },
    });
    expect(resource).toBeInstanceOf(Resource);
  });
});
