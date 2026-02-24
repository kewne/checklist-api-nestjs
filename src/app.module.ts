import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { FirebaseAdminModule } from './firebase-admin.module';
import { FirestoreModule } from './firestore.module';
import { ChecklistModule } from './checklist/checklist.module';
import { HateoasModule } from './hateoas/hateoas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseAdminModule,
    FirestoreModule,
    ChecklistModule,
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
