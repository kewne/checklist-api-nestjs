import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

      if (!projectId) {
        throw new Error(
          'GOOGLE_CLOUD_PROJECT_ID environment variable is required',
        );
      }

      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    }
  }

  async verifyToken(idToken: string): Promise<AuthUser> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
