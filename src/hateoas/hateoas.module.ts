import { Module } from '@nestjs/common';
import { HateoasInterceptor } from './hateoas.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      useClass: HateoasInterceptor,
      provide: APP_INTERCEPTOR,
    },
  ],
})
export class HateoasModule {}
