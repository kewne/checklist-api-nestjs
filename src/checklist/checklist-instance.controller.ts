import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory, toHandler } from '@app/hateoas-nest';
import { Response } from 'express';
import { CompleteItemDto } from './dto/complete-item.dto';
import { IncompleteItemDto } from './dto/incomplete-item.dto';
import { ReplaceChecklistInstanceDto } from './dto/replace-checklist-instance.dto';

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

    const completedItems = instance.items.filter((item) => item.completed);
    if (completedItems.length > 0) {
      resource.withRel(
        'mark-incomplete-item',
        ...completedItems.map((item) =>
          toHandler(ChecklistInstanceController, 'markItemIncomplete', {
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

  @Post(':instanceId/items/:itemId/complete')
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

  @Post(':instanceId/items/:itemId/incomplete')
  @UsePipes(new ValidationPipe({ transform: true }))
  async markItemIncomplete(
    @Param('instanceId') instanceId: string,
    @Param('itemId') itemId: string,
    @Body() _dto: IncompleteItemDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    await this.instanceService.markItemIncomplete(instanceId, itemId);
    res.statusCode = 303;
    res.setHeader(
      'location',
      linkFactory.toAbsolute(`/checklist-instances/${instanceId}`).href,
    );
  }

  @Put(':instanceId')
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true }))
  async replace(
    @Param('instanceId') instanceId: string,
    @Body() dto: ReplaceChecklistInstanceDto,
  ): Promise<void> {
    await this.instanceService.replace(instanceId, dto);
  }

  @Delete(':instanceId')
  remove(@Param('instanceId') instanceId: string) {
    return this.instanceService.remove(instanceId);
  }
}
