import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { FirebaseAdminModule } from '../firebase-admin.module';

@Module({
  imports: [FirebaseAdminModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
