import { Controller, Get, Param } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';

@Controller('checklist-instances')
export class ChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Get(':instanceId')
  async findOne(
    @Param('instanceId') instanceId: string,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.findOne(instanceId);

    const resource = linkFactory
      .buildResource()
      .withRel(
        'checklist',
        linkFactory.toAbsolute(`/checklists/${instance.checklistId}`),
      )
      .toResource(instance);

    return resource;
  }
}
