import { Controller, Get } from '@nestjs/common';
import { Resource } from './hateoas';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  root(): Resource {
    return new Resource({
      self: { href: '/' },
      related: [
        { href: '/hello' },
        { name: 'checklists', href: '/checklists' },
      ],
    });
  }
}
