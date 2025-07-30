import { Controller, Get } from '@nestjs/common';
import {
  extractRouteFromHandler,
  LinkRegistration,
  Resource,
  ResourceBuilder,
} from './hateoas';
import { Reflector } from '@nestjs/core';
import { HelloController } from './hello/hello.controller';

@Controller()
export class AppController {
  constructor(private reflector: Reflector) {}

  @Get()
  root(@LinkRegistration() builder: ResourceBuilder): Resource {
    return builder
      .addLink('related', {
        href: extractRouteFromHandler(
          HelloController,
          HelloController.prototype.hello,
          this.reflector,
        ),
      })
      .addLink('related', { name: 'checklists', href: '/checklists' })
      .toResource();
  }
}
