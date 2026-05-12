import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
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
import type { Response } from 'express';
import { CompleteItemDto } from './dto/complete-item.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { IncompleteItemDto } from './dto/incomplete-item.dto';
import { ReplaceChecklistInstanceDto } from './dto/replace-checklist-instance.dto';
import { InstanceService } from './instance.service';
import { InstanceResource } from './resources/instance.resource';

@Controller('checklist-instances')
export class ChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Get(':instanceId')
  async findOne(
    @Param('instanceId') instanceId: string,
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.findOne(instanceId);
    return InstanceResource.toResource(instance, user.uid, linkFactory);
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
      linkFactory.toHandler(ChecklistInstanceController, 'findOne', {
        params: { instanceId },
      }),
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
      linkFactory.toHandler(ChecklistInstanceController, 'findOne', {
        params: { instanceId },
      }),
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

  @Post(':instanceId/add-item')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addItem(
    @Param('instanceId') instanceId: string,
    @Body() dto: CreateItemDto,
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.addItem(instanceId, dto);
    return InstanceResource.toResource(instance, user.uid, linkFactory);
  }

  @Delete(':instanceId')
  remove(@Param('instanceId') instanceId: string) {
    return this.instanceService.remove(instanceId);
  }
}
