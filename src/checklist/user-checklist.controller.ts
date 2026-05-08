import { DecodeBase64JsonPipe } from '@app/common/pipes';
import { Hateoas, NestLinkFactory, toHandler } from '@app/hateoas-nest';
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
import { Response } from 'express';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

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
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join(', ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    const checklist = await this.checklistService.create(finalDto, userId);
    res.setHeader(
      'location',
      linkFactory.toHandler(ChecklistController, 'findOne', {
        params: { id: checklist.id },
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
        ...checklists.map((checklist) =>
          toHandler(ChecklistController, 'findOne', {
            name: checklist.title,
            params: {
              id: checklist.id,
            },
          }),
        ),
      )
      .toResource({});

    return resource;
  }
}
