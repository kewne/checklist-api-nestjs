import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChecklistInstance } from './dto';
import { InstanceService } from './instance.service';
import { UserChecklistController } from '../user-checklist.controller';
import { ChecklistInstanceController } from './checklist-instance.controller';

@Controller('users/:userId/checklist-instances')
export class UserChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post('/create')
  async createInstance(
    @Param('userId') userId: string,
    @Body() dto: ChecklistInstance,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instanceId = await this.instanceService.createFromData(userId, dto);
    res.status(201).setHeader(
      'location',
      linkFactory.toHandler(ChecklistInstanceController, 'findOne', {
        params: { instanceId },
      }),
    );
  }

  @Get()
  async findCreatedBy(
    @Param('userId') userId: string,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instances = await this.instanceService.findCreatedBy(userId);

    const resource = linkFactory
      .buildResource()
      .withRel(
        'items',
        ...instances.map((instance) =>
          toHandlerCall({
            controller: ChecklistInstanceController,
            name: instance.id,
            title: instance.title,
          }).findOne({ params: { instanceId: instance.id } }),
        ),
      )
      .withRel(
        'create',
        toHandlerCall({
          controller: UserChecklistInstanceController,
        }).createInstance({ params: { userId } }),
      )
      .toResource({});

    return resource;
  }

  @Post(':instanceId/create-checklist')
  async createChecklistFromInstance(
    @Param('instanceId') instanceId: string,
    @User() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.findOne(instanceId);

    const items = instance.items.map((item) => ({
      title: item.title,
      description: item.description ?? '',
    }));

    const baseDto = {
      title: `${instance.title} (snapshot)`,
      items,
    };

    const createLink = linkFactory.toHandler(
      UserChecklistController,
      'create',
      {
        params: {
          userId: user.uid,
        },
        query: {
          base: Buffer.from(JSON.stringify(baseDto)).toString('base64'),
        },
      },
    );
    res.statusCode = 307;
    res.setHeader('location', createLink);
  }
}
