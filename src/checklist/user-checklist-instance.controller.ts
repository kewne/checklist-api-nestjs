import { Controller, Get, Param } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';

@Controller('users/:userId/checklist-instances')
export class UserChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Get()
  async findCreatedBy(
    @Param('userId') userId: string,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instances = await this.instanceService.findCreatedBy(userId);

    const resource = linkFactory
      .buildResource()
      .withRel(
        'items',
        ...instances.map((instance) => ({
          href: linkFactory.toAbsolute(`/checklist-instances/${instance.id}`)
            .href,
          name: instance.title,
        })),
      )
      .toResource({});

    return resource;
  }
}
