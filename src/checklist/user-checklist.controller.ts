import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { Response } from 'express';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { ChecklistController } from './checklist.controller';
import { DecodeBase64JsonPipe } from '@app/common/pipes';

@Controller('users/:userId/checklists')
export class UserChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  async create(
    @Param('userId') userId: string,
    @Body() createChecklistDto: CreateChecklistDto,
    @Query('base', new DecodeBase64JsonPipe<CreateChecklistDto>())
    decodedBase: CreateChecklistDto | undefined,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const finalDto: CreateChecklistDto = decodedBase
      ? {
          title: createChecklistDto?.title ?? decodedBase.title,
          items: createChecklistDto?.items ?? decodedBase.items,
        }
      : createChecklistDto;
    // Validate the final DTO
    const instance = plainToInstance(CreateChecklistDto, finalDto);
    const errors = await validate(instance);
    if (errors.length > 0) {
      const errorMessages = errors
        .flatMap((e) => Object.values(e.constraints || {}))
        .join(', ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    const checklist = await this.checklistService.create(finalDto, userId);
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
