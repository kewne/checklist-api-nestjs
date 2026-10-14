import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserChecklistController } from './user-checklist.controller';

@Controller('my/checklists')
export class MyChecklistController {
  @Get()
  resolve(
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 303;
    response.setHeader(
      'location',
      linkFactory.toHandler(UserChecklistController, 'findAllCreatedBy', {
        params: { userId: user.uid },
      }),
    );
  }

  @Post()
  create(
    @User() user: AuthUser,
    @Query('base') base: string | undefined,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 307;
    response.setHeader(
      'location',
      linkFactory.toHandler(UserChecklistController, 'create', {
        params: { userId: user.uid },
        query: base === undefined ? undefined : { base },
      }),
    );
  }
}
