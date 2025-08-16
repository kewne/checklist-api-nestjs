import { Controller, Get } from '@nestjs/common';
import { LinkRegistration, NestResourceBuilder } from './hateoas-nest';
import { Reflector } from '@nestjs/core';
import { HelloController } from './hello/hello.controller';
import { ChecklistController } from './checklist/checklist.controller';
import { Resource } from './hateoas';

@Controller()
export class AppController {
  constructor(private reflector: Reflector) {}

  @Get()
  root(@LinkRegistration() builder: NestResourceBuilder): Resource {
    return builder
      .addLinkToHandler('related', {
        controller: HelloController,
        handler: 'hello',
      })
      .addLinkToHandler('related', {
        name: 'checklists',
        controller: ChecklistController,
        handler: 'findAll',
      })
      .toResource();
  }
}
