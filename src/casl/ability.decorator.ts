import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AppAbility } from './ability.factory';
import { ABILITY_KEY } from './casl.interceptor';

export const Ability = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppAbility => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { [ABILITY_KEY]: AppAbility | undefined }>();
    const ability = request[ABILITY_KEY];
    if (!ability) {
      throw new UnauthorizedException();
    }
    return ability;
  },
);
