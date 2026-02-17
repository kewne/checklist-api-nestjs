import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { USER_AUTH_KEY } from './auth.constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

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
      const user = await this.authService.verifyToken(token);
      request[USER_AUTH_KEY] = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
