import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { ChecklistModule } from './checklist/checklist.module';
import { InvitationModule } from './checklist/invitation/invitation.module';
import { InstanceModule } from './checklist/instance/instance.module';
import { FirebaseAdminModule } from './firebase-admin.module';
import { FirestoreModule } from './firestore.module';
import { HateoasModule } from './hateoas/hateoas.module';
import { resourceEnrichers, ResourceTypes } from './resource-enrichers';
import { SubscriptionModule } from './subscription/subscription.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseAdminModule,
    FirestoreModule,
    ChecklistModule,
    InstanceModule,
    InvitationModule,
    SubscriptionModule,
    HateoasModule.registerEnrichers<ResourceTypes>(resourceEnrichers),
    AuthModule,
    CaslModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'restspec'),
      exclude: ['/{*any}'],
      serveStaticOptions: {
        extensions: ['yml', 'json'],
        index: false,
        redirect: false,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
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
