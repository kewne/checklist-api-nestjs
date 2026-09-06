import { DynamicModule, Module } from '@nestjs/common';
import { HateoasInterceptor } from './hateoas.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  EnricherRegistry,
  RESOURCE_ENRICHER_REGISTRY,
  ResourceMap,
} from '../hateoas-nest';

@Module({
  providers: [
    {
      useClass: HateoasInterceptor,
      provide: APP_INTERCEPTOR,
    },
    {
      provide: RESOURCE_ENRICHER_REGISTRY,
      useValue: {} satisfies EnricherRegistry,
    },
  ],
})
export class HateoasModule {
  static registerEnrichers<M extends ResourceMap>(
    registry: EnricherRegistry<M>,
  ): DynamicModule {
    return {
      module: HateoasModule,
      providers: [
        {
          provide: RESOURCE_ENRICHER_REGISTRY,
          useValue: registry,
        },
      ],
    };
  }
}
