import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { CaslForbiddenErrorFilter } from './casl-forbidden-error.filter';
import { CaslInterceptor } from './casl.interceptor';

@Module({
  providers: [
    AbilityFactory,
    { provide: APP_INTERCEPTOR, useClass: CaslInterceptor },
    { provide: APP_FILTER, useClass: CaslForbiddenErrorFilter },
  ],
  exports: [AbilityFactory],
})
export class CaslModule {}
