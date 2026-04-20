import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory, toHandler } from '@app/hateoas-nest';
import { Response } from 'express';
import { CompleteItemDto } from './dto/complete-item.dto';

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
      );

    const incompleteItems = instance.items.filter((item) => !item.completed);
    if (incompleteItems.length > 0) {
      resource.withRel(
        'complete-item',
        ...incompleteItems.map((item) =>
          toHandler(ChecklistInstanceController, 'completeItem', {
            name: item.id,
            title: item.title,
            params: { instanceId, itemId: item.id },
          }),
        ),
      );
    }

    const transformedInstance = {
      ...instance,
      items: instance.items.map(({ id, ...rest }) => ({
        ...rest,
        name: id,
      })),
    };

    return resource.toResource(transformedInstance);
  }

  @Post(':instanceId/item/:itemId/complete')
  @UsePipes(new ValidationPipe({ transform: true }))
  async completeItem(
    @Param('instanceId') instanceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CompleteItemDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    await this.instanceService.completeItem(instanceId, itemId, dto.note);
    res.statusCode = 303;
    res.setHeader(
      'location',
      linkFactory.toAbsolute(`/checklist-instances/${instanceId}`).href,
    );
  }
}
