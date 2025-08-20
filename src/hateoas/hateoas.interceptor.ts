import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

export const REFLECTOR_KEY = Symbol('Nest.js reflector');
export const MODULE_KEY = Symbol('Nest.js module ref');

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    req[REFLECTOR_KEY] = this.reflector;
    req[MODULE_KEY] = this.moduleRef;
    return next.handle();
  }
}
