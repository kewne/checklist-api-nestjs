import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DecodeBase64JsonPipe<T>
  implements PipeTransform<string | undefined, T | undefined>
{
  transform(value: string | undefined): T | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Base64 value must be a string');
    }

    try {
      const decoded = Buffer.from(value, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded) as T;

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON in base64-encoded value');
      }
      throw new BadRequestException('Failed to decode base64 value');
    }
  }
}
