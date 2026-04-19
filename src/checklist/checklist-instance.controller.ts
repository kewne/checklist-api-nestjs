import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { User } from '@app/auth/user.decorator';
import { AuthUser } from '@app/auth/auth.guard';

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
      .withRel('checklist', linkFactory.toAbsolute(`/checklists/${instance.checklistId}`))
      .toResource(instance);

    return resource;
  }

  @Post()
  async createInstance(
    @Query('checklist_id') checklistId: string,
    @User() user: AuthUser,
    @Body() createInstanceDto: CreateChecklistInstanceDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.createInstance(
      checklistId,
      user.uid,
      createInstanceDto.title,
    );
    res.setHeader(
      'location',
      linkFactory.toAbsolute(`/checklist-instances/${instance.id}`).href,
    );
  }
}
