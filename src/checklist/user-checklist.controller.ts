import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { ChecklistController } from './checklist.controller';

@Controller('users/:userId/checklists')
export class UserChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  async create(
    @Param('userId') userId: string,
    @Body() createChecklistDto: CreateChecklistDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const checklist = await this.checklistService.create(
      createChecklistDto,
      userId,
    );
    res.setHeader(
      'location',
      linkFactory.toHandler(ChecklistController, 'findOne', {
        id: checklist.id,
      }),
    );
  }

  @Get()
  async findAllCreatedBy(
    @Param('userId') userId: string,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const checklists = await this.checklistService.findAllByUser(userId);

    const resource = linkFactory
      .buildResource()
      .withRel(
        'items',
        ...checklists.map((checklist) => ({
          href: linkFactory.toHandler(ChecklistController, 'findOne', {
            id: checklist.id,
          }),
          name: checklist.title,
        })),
      )
      .toResource({});

    return resource;
  }
}
