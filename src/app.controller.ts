import { Controller, Get } from '@nestjs/common';
import { MyChecklistController } from './checklist/my-checklist.controller';
import { MyChecklistInstanceController } from './checklist/instance/my-checklist-instance.controller';
import { Hateoas, NestLinkFactory, toHandlerCall } from './hateoas-nest';
import { ResourceTypes } from './resource-enrichers';
import { MySubscriptionController } from './subscription/my-subscription.controller';

@Controller()
export class AppController {
  @Get()
  root(@Hateoas() linkFactory: NestLinkFactory<ResourceTypes>) {
    return linkFactory
      .buildResource('root')
      .withRel(
        'related',
        toHandlerCall({
          controller: MyChecklistController,
          name: 'checklists',
        }).resolve({}),
        toHandlerCall({
          controller: MyChecklistInstanceController,
          name: 'checklist-instances',
        }).resolve({}),
        toHandlerCall({
          controller: MySubscriptionController,
          name: 'subscription',
        }).resolve({}),
      )
      .withRel(
        'create',
        toHandlerCall({
          controller: MyChecklistController,
          name: 'checklists',
        }).create({}),
        toHandlerCall({
          controller: MyChecklistInstanceController,
          name: 'checklist-instances',
        }).createInstance({}),
      )
      .toResource({});
  }
}
