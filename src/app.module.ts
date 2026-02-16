import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Checklist } from './checklist/checklist.entity';
import { ChecklistModule } from './checklist/checklist.module';
import { HateoasModule } from './hateoas/hateoas.module';
import { ChecklistInstance } from './checklist/checklist-instance.entity';

@Module({
  imports: [
    ChecklistModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'checklist.db',
      synchronize: true,
      entities: [Checklist, ChecklistInstance],
    }),
    HateoasModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => {
        return new ClassSerializerInterceptor(reflector, {
          excludeExtraneousValues: true,
        });
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
