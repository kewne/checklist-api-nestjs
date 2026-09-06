import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
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
import { ResourceTypes } from '@app/resource-enrichers';
import { ChecklistService } from './checklist.service';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Hateoas() linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    const checklist = await this.checklistService.findOne(id);
    if (!checklist) {
      return null;
    }
    return linkFactory.buildResource('checklist').toResource(checklist);
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
