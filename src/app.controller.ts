import { Controller, Get } from '@nestjs/common';
import { extractRouteFromHandler, LinkRegistration } from './hateoas-nest';
import { Reflector } from '@nestjs/core';
import { HelloController } from './hello/hello.controller';
import { ChecklistController } from './checklist/checklist.controller';
import { ResourceBuilder, Resource } from './hateoas';

@Controller()
export class AppController {
  constructor(private reflector: Reflector) {}

  @Get()
  root(@LinkRegistration() builder: ResourceBuilder): Resource {
    return builder
      .addLink('related', {
        href: extractRouteFromHandler(HelloController, 'hello', this.reflector),
      })
      .addLink('related', {
        name: 'checklists',
        href: extractRouteFromHandler(
          ChecklistController,
          'findAll',
          this.reflector,
        ),
      })
      .toResource();
  }
}
