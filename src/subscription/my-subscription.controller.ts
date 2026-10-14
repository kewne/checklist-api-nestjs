import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SubscriptionController } from './subscription.controller';

@Controller('my/subscription')
export class MySubscriptionController {
  @Get()
  resolve(
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.statusCode = 303;
    response.setHeader(
      'location',
      linkFactory.toHandler(SubscriptionController, 'findOne', {
        params: { userId: user.uid },
      }),
    );
  }
}
