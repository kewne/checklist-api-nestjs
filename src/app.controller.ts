import { Controller, Get } from '@nestjs/common';
import { UserChecklistController } from './checklist/user-checklist.controller';
import { Hateoas, NestLinkFactory, toHandler } from './hateoas-nest';
import { User } from './auth/user.decorator';
import { AuthUser } from './auth/auth.guard';

@Controller()
export class AppController {
  @Get()
  root(@User() user: AuthUser, @Hateoas() linkFactory: NestLinkFactory) {
    return linkFactory
      .buildResource()
      .withRel(
        'related',
        toHandler(UserChecklistController, 'findAllCreatedBy', {
          name: 'checklists',
          params: { userId: user.uid },
        }),
      )
      .toResource();
  }
}
