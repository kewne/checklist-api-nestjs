import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { BaseUrlResourceBuilder } from './hateoas';

export const LinkRegistration = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return new BaseUrlResourceBuilder(`${req.protocol}://${req.host}`, req.url);
  },
);

export type MaybeHandlerFunction<C> = {
  [H in keyof C]-?: C[H] extends (...args: never) => unknown ? H : never;
}[keyof C];

export function extractRouteFromHandler<C>(
  controller: Type<C>,
  handler: MaybeHandlerFunction<C>,
  reflector: Reflector,
): string {
  const controllerPath = reflector.get<string | undefined>(
    PATH_METADATA,
    controller,
  );
  if (controllerPath === undefined) {
    throw new Error('Class is not a controller');
  }
  const methodPath = reflector.get<string | undefined>(
    PATH_METADATA,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    controller.prototype[handler],
  );
  if (methodPath === undefined) {
    throw new Error('Method is not a handler method');
  }
  if (methodPath.startsWith('/')) {
    return `${controllerPath}${methodPath}`;
  }
  return `${controllerPath}/${methodPath}`;
}
