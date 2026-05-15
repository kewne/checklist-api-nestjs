import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ForbiddenError } from '@casl/ability';
import { Response } from 'express';
import { AppAbility } from './ability.factory';

@Catch(ForbiddenError)
export class CaslForbiddenErrorFilter implements ExceptionFilter {
  catch(_exception: ForbiddenError<AppAbility>, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(403).json({ statusCode: 403, message: 'Forbidden' });
  }
}
