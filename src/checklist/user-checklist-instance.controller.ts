import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { User } from '@app/auth/user.decorator';
import { AuthUser } from '@app/auth/auth.guard';
import { CreateChecklistInstanceFromDataDto } from './dto/create-checklist-instance-from-data.dto';
import { Response } from 'express';

@Controller('users/:userId/checklist-instances')
export class UserChecklistInstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post()
  async createInstance(
    @Param('userId') userId: string,
    @User() user: AuthUser,
    @Body() dto: CreateChecklistInstanceFromDataDto,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const instance = await this.instanceService.createFromData(
      user.uid,
      dto,
    );
    res.status(201).setHeader(
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
}
