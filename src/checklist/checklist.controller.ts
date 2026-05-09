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
import { ChecklistService } from './checklist.service';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import { CreateInstanceController } from './create-instance.controller';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get(':id')
  async findOne(
    @Param('id') id: string,
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
          controller: CreateInstanceController,
          name: 'instance',
        }).createInstance({ params: { id: checklist.id } }),
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
