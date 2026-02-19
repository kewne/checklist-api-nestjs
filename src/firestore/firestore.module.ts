import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Firestore } from '@google-cloud/firestore';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Firestore,
      useFactory: (configService: ConfigService): Firestore => {
        return new Firestore({
          projectId:
            configService.get<string>('GOOGLE_CLOUD_PROJECT_ID') ||
            configService.get<string>('FIRESTORE_PROJECT_ID'),
          keyFilename: configService.get<string>(
            'GOOGLE_APPLICATION_CREDENTIALS',
          ),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [Firestore],
})
export class FirestoreModule {}
