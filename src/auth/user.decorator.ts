import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from './auth.service';
import { USER_AUTH_KEY } from './auth.constants';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { [USER_AUTH_KEY]: AuthUser }>();
    return request[USER_AUTH_KEY];
  },
);
