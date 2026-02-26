import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  async create(
    @Body() createChecklistDto: CreateChecklistDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const checklist = await this.checklistService.create(createChecklistDto);
    res.setHeader(
      'location',
      linkFactory.toHandler(ChecklistController, 'findOne', {
        id: checklist.id,
      }),
    );
  }

  @Get()
  async findAll() {
    return this.checklistService.findAll();
  }

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
        'instances',
        linkFactory.toAbsolute(`/checklists/${id}/instances`),
      )
      .toResource(checklist);
    return resource;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    return this.checklistService.update(id, updateChecklistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }
}
