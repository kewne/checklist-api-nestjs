import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { USER_AUTH_KEY } from '../auth/auth.constants';
import { AuthUser } from '../auth/auth.guard';
import { AbilityFactory } from './ability.factory';

export const ABILITY_KEY = Symbol('AbilityKey');

@Injectable()
export class CaslInterceptor implements NestInterceptor {
  constructor(private readonly abilityFactory: AbilityFactory) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx
      .switchToHttp()
      .getRequest<
        Request & { [USER_AUTH_KEY]: AuthUser; [ABILITY_KEY]: unknown }
      >();

    const user = request[USER_AUTH_KEY];
    if (user) {
      request[ABILITY_KEY] = this.abilityFactory.createForUser(user);
    }

    return next.handle();
  }
}
