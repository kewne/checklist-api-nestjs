import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from './auth.guard';
import { USER_AUTH_KEY } from './auth.constants';

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(private readonly getUserCallback: () => AuthUser) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = this.getUserCallback();
    req[USER_AUTH_KEY] = user;
    return true;
  }
}
