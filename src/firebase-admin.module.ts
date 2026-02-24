import { Module } from '@nestjs/common';
import { initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

export const FIREBASE_APP = Symbol('FIREBASE_APP');

@Module({
  imports: [],
  providers: [
    {
      provide: FIREBASE_APP,
      useFactory: initializeApp,
    },
    {
      provide: Auth,
      useFactory: (app: App): Auth => {
        return getAuth(app);
      },
      inject: [FIREBASE_APP],
    },
  ],
  exports: [FIREBASE_APP, Auth],
})
export class FirebaseAdminModule {}
