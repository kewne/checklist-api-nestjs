import { Controller, Get } from '@nestjs/common';
import { ChecklistController } from './checklist/checklist.controller';
import { Resource } from './hateoas';
import {
  LinkRegistration,
  NestResourceBuilder,
  toHandler,
} from './hateoas-nest';

@Controller()
export class AppController {
  @Get()
  root(@LinkRegistration() builder: NestResourceBuilder): Resource {
    return builder
      .withRel(
        'related',
        toHandler(ChecklistController, 'findAll', { name: 'checklists' }),
      )
      .toResource();
  }
}
