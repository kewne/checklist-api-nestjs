import { Controller, Get } from '@nestjs/common';
import { UserChecklistController } from './checklist/user-checklist.controller';
import { UserChecklistInstanceController } from './checklist/instance/user-checklist-instance.controller';
import { Hateoas, NestLinkFactory, toHandlerCall } from './hateoas-nest';
import { User } from './auth/user.decorator';
import type { AuthUser } from './auth/auth.guard';

@Controller()
export class AppController {
  @Get()
  root(@User() user: AuthUser, @Hateoas() linkFactory: NestLinkFactory) {
    return linkFactory
      .buildResource()
      .withRel(
        'related',
        toHandlerCall({
          controller: UserChecklistController,
          name: 'checklists',
        }).findAllCreatedBy({ params: { userId: user.uid } }),
        toHandlerCall({
          controller: UserChecklistInstanceController,
          name: 'checklist-instances',
        }).findCreatedBy({ params: { userId: user.uid } }),
      )
      .withRel(
        'create',
        toHandlerCall({
          controller: UserChecklistController,
          name: 'checklists',
        }).create({ params: { userId: user.uid } }),
        toHandlerCall({
          controller: UserChecklistInstanceController,
          name: 'checklist-instances',
        }).createInstance({ params: { userId: user.uid } }),
      )
      .toResource();
  }
}
