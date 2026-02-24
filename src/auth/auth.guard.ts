import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'firebase-admin/auth';
import { USER_AUTH_KEY } from './auth.constants';
import { Request } from 'express';

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token || token.trim().length === 0) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      const user: AuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
      };
      request[USER_AUTH_KEY] = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
