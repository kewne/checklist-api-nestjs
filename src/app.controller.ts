import { Controller, Get } from '@nestjs/common';
import { LinkRegistration, Resource, ResourceBuilder } from './hateoas';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  root(@LinkRegistration() builder: ResourceBuilder): Resource {
    return builder
      .addLink('related', { href: '/hello' })
      .addLink('related', { name: 'checklists', href: '/checklists' })
      .toResource();
  }
}
