import { DecodeBase64JsonPipe } from '@app/common/pipes';
import { Ability } from '@app/casl/ability.decorator';
import type { AppAbility } from '@app/casl/ability.factory';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
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
import { type Response } from 'express';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { ShareService } from './share.service';

@Controller('users/:userId/checklists')
export class UserChecklistController {
  constructor(
    private readonly checklistService: ChecklistService,
    private readonly shareService: ShareService,
  ) {}

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
          toHandlerCall({
            controller: ChecklistController,
            name: checklist.title,
          }).findOne({ params: { id: checklist.id } }),
        ),
      )
      .withRel(
        'create',
        toHandlerCall({
          controller: UserChecklistController,
        }).create({ params: { userId } }),
      )
      .withRel(
        'related',
        toHandlerCall({
          controller: UserChecklistController,
          name: 'shared',
        }).findAllSharedWith({ params: { userId } }),
      )
      .toResource({});

    return resource;
  }

  @Get('shared')
  async findAllSharedWith(
    @Param('userId') userId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const checklists = await this.shareService.listChecklistsSharedWithUser(
      userId,
      ability,
    );

    const resource = linkFactory
      .buildResource()
      .withRel(
        'items',
        ...checklists.map((checklist) =>
          toHandlerCall({
            controller: ChecklistController,
            name: checklist.title,
          }).findOne({ params: { id: checklist.id } }),
        ),
      )
      .toResource({});

    return resource;
  }
}
