import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';

@Controller()
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post('checklists/:id/instances')
  async createInstance(
    @Param('id') checklistId: string,
    @Body() createInstanceDto: CreateChecklistInstanceDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.createInstance(
      +checklistId,
      createInstanceDto,
    );
    res.setHeader(
      'location',
      linkFactory.toAbsolute(`/checklist-instances/${instance.id}`).href,
    );
  }
}
