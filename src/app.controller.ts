import { Controller, Get } from '@nestjs/common';
import {
  LinkRegistration,
  NestResourceBuilder,
  toHandler,
} from './hateoas-nest';
import { HelloController } from './hello/hello.controller';
import { ChecklistController } from './checklist/checklist.controller';
import { Resource } from './hateoas';

@Controller()
export class AppController {
  @Get()
  root(@LinkRegistration() builder: NestResourceBuilder): Resource {
    return builder
      .withRel(
        'related',
        toHandler(HelloController, 'hello'),
        toHandler(ChecklistController, 'findAll', { name: 'checklists' }),
      )
      .toResource();
  }
}
