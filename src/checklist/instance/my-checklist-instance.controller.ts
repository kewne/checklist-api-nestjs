import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { Controller, Get, Post, Res } from '@nestjs/common';
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
    response.setHeader(
      'location',
      linkFactory.toHandler(UserChecklistInstanceController, 'findCreatedBy', {
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
    response.setHeader(
      'location',
      linkFactory.toHandler(UserChecklistInstanceController, 'createInstance', {
        params: { userId: user.uid },
      }),
    );
  }
}
