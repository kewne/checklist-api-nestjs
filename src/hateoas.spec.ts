import {
  BaseUrlNestedResourceBuilder,
  BaseUrlResourceBuilder,
  Resource,
} from './hateoas';

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

  it('should include _nested in toJSON when non-empty nested arrays are provided', () => {
    const resource = new Resource(
      { self: { href: '/resource/1' } },
      { id: 1 },
      {
        items: [
          {
            id: 'item-1',
            _links: { 'complete-item': { href: '/resource/1/items/item-1' } },
          },
        ],
      },
    );

    expect(resource.toJSON()).toEqual({
      id: 1,
      _links: { self: { href: '/resource/1' } },
      _nested: {
        items: [
          {
            id: 'item-1',
            _links: { 'complete-item': { href: '/resource/1/items/item-1' } },
          },
        ],
      },
    });
  });

  it('should omit empty nested arrays and omit _nested when all nested arrays are empty in toJSON', () => {
    const resource = new Resource(
      { self: { href: '/resource/1' } },
      { id: 1 },
      { items: [] },
    );

    expect(resource.toJSON()).toEqual({
      id: 1,
      _links: { self: { href: '/resource/1' } },
    });
  });
});

describe('BaseUrlResourceBuilder', () => {
  it('builds a nested resource without a self link', () => {
    const nested = new BaseUrlNestedResourceBuilder('http://localhost')
      .withRel('complete-item', { href: '/items/1/complete' })
      .toResource({ id: '1' });

    expect(nested).toEqual({
      id: '1',
      _links: {
        'complete-item': { href: 'http://localhost/items/1/complete' },
      },
    });
    expect(nested._links.self).toBeUndefined();
  });

  it('attaches nested resources under _nested and appends when called multiple times', () => {
    const item1 = new BaseUrlNestedResourceBuilder('http://localhost')
      .withRel('complete-item', { href: '/items/1/complete' })
      .toResource({ id: '1' });
    const item2 = new BaseUrlNestedResourceBuilder('http://localhost')
      .withRel('mark-incomplete-item', { href: '/items/2/incomplete' })
      .toResource({ id: '2' });

    const resource = new BaseUrlResourceBuilder(
      'http://localhost',
      '/resources/1',
    )
      .withNested('items', item1)
      .withNested('items', item2)
      .toResource({ id: 'r1' });

    expect(resource).toEqual({
      id: 'r1',
      _links: {
        self: { href: 'http://localhost/resources/1' },
      },
      _nested: {
        items: [item1, item2],
      },
    });
  });

  it('omits empty nested arrays and omits _nested when no non-empty nested arrays exist', () => {
    const resource = new BaseUrlResourceBuilder(
      'http://localhost',
      '/resources/1',
    )
      .withNested('items')
      .toResource({ id: 'r1' });

    expect(resource).toEqual({
      id: 'r1',
      _links: {
        self: { href: 'http://localhost/resources/1' },
      },
    });
    expect(resource._nested).toBeUndefined();
  });
});
