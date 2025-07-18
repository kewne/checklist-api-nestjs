import { Controller, Get } from '@nestjs/common';
import { Resource } from '../hateoas';

@Controller('hello')
export class HelloController {
  @Get('hello')
  hello(): Resource {
    return new Resource(
      {
        self: {
          href: `/hello`,
        },
      },
      { message: 'Hello World' },
    );
  }
}
