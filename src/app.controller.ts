import { Controller, Get } from '@nestjs/common';
import { ChecklistController } from './checklist/checklist.controller';
import { Hateoas, NestLinkFactory, toHandler } from './hateoas-nest';

@Controller()
export class AppController {
  @Get()
  root(@Hateoas() linkFactory: NestLinkFactory) {
    return linkFactory
      .buildResource()
      .withRel(
        'related',
        toHandler(ChecklistController, 'findAll', { name: 'checklists' }),
      )
      .toResource();
  }
}
