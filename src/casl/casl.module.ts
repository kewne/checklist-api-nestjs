import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { CaslInterceptor } from './casl.interceptor';

@Module({
  providers: [
    AbilityFactory,
    { provide: APP_INTERCEPTOR, useClass: CaslInterceptor },
  ],
  exports: [AbilityFactory],
})
export class CaslModule {}
