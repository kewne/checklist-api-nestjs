import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChecklistShareController } from './checklist-share.controller';
import { ChecklistService } from './checklist.service';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';
import { UserChecklistInstanceController } from './instance/user-checklist-instance.controller';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const checklist = await this.checklistService.findOne(id);
    if (!checklist) {
      return null;
    }
    const resource = linkFactory
      .buildResource()
      .withRel(
        'create-from',
        toHandlerCall({
          controller: UserChecklistInstanceController,
          name: 'instance',
        }).createFromChecklist({
          params: { userId: user.uid },
          query: { checklist_id: checklist.id },
        }),
      )
      .withRel(
        'related',
        toHandlerCall({
          controller: ChecklistShareController,
          name: 'shares',
        }).list({ params: { checklistId: checklist.id } }),
      )
      .toResource(checklist);
    return resource;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  replace(@Param('id') id: string, @Body() body: ReplaceChecklistDto) {
    return this.checklistService.replace(id, body);
  }
}
