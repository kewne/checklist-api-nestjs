import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { User } from '@app/auth/user.decorator';
import { AuthUser } from '@app/auth/auth.guard';

@Controller('checklists')
export class ChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post(':checklistId')
  async createInstance(
    @Param('checklistId') checklistId: string,
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
