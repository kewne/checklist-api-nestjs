import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DecodeBase64JsonPipe<T>
  implements PipeTransform<string | undefined, T | undefined>
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): T | undefined {
    // If no value provided, return undefined
    if (!value) {
      return undefined;
    }

    // Only process strings
    if (typeof value !== 'string') {
      throw new BadRequestException('Base64 value must be a string');
    }

    try {
      // Decode base64 string
      const decoded = Buffer.from(value, 'base64').toString('utf-8');

      // Parse JSON

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
