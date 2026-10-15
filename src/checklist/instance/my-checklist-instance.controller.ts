import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import { Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';

@Controller('my/checklist-instances')
export class MyChecklistInstanceController {
  @Get()
  resolve(
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 303;
    linkFactory.setLocation(
      toHandlerCall({
        controller: UserChecklistInstanceController,
      }).findCreatedBy({
        params: { userId: user.uid },
      }),
    );
  }

  @Post('create')
  createInstance(
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 307;
    linkFactory.setLocation(
      toHandlerCall({
        controller: UserChecklistInstanceController,
      }).createInstance({
        params: { userId: user.uid },
      }),
    );
  }

  @Post('create-from-checklist')
  createFromChecklist(
    @User() user: AuthUser,
    @Query('checklist_id') checklistId: string,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 307;
    linkFactory.setLocation(
      toHandlerCall({
        controller: UserChecklistInstanceController,
      }).createFromChecklist({
        params: { userId: user.uid },
        query: { checklist_id: checklistId },
      }),
    );
  }

  @Post(':instanceId/create-checklist')
  createChecklistFromInstance(
    @Param('instanceId') instanceId: string,
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 307;
    linkFactory.setLocation(
      toHandlerCall({
        controller: UserChecklistInstanceController,
      }).createChecklistFromInstance({
        params: { userId: user.uid, instanceId },
      }),
    );
  }
}
