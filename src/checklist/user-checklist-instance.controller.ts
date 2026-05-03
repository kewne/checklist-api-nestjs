import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { User } from '@app/auth/user.decorator';
import { AuthUser } from '@app/auth/auth.guard';
import { CreateChecklistInstanceFromDataDto } from './dto/create-checklist-instance-from-data.dto';
import { Response } from 'express';
import { UserChecklistController } from './user-checklist.controller';

@Controller('users/:userId/checklist-instances')
export class UserChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post()
  async createInstance(
    @User() user: AuthUser,
    @Body() dto: CreateChecklistInstanceFromDataDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.createFromData(user.uid, dto);
    res
      .status(201)
      .setHeader(
        'location',
        linkFactory.toAbsolute(`/checklist-instances/${instance.id}`).href,
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
        ...instances.map((instance) => ({
          href: linkFactory.toAbsolute(`/checklist-instances/${instance.id}`)
            .href,
          name: instance.title,
        })),
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
    // Fetch the instance
    const instance = await this.instanceService.findOne(instanceId);

    // Transform instance items to CreateItemDto format
    const items = instance.items.map((item) => ({
      title: item.title,
      description: item.description || '',
    }));

    // Create the base DTO
    const baseDto = {
      title: `${instance.title} (snapshot)`,
      items,
    };

    // Encode to base64
    const encoded = Buffer.from(JSON.stringify(baseDto)).toString('base64');

    // Redirect to create endpoint with base param using toHandler
    const createLink = linkFactory.toHandler(
      UserChecklistController,
      'create',
      {
        userId: user.uid,
        base: encoded,
      },
    );
    res.statusCode = 307;
    res.setHeader('location', createLink);
  }
}
