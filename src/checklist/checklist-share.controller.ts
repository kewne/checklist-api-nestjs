import { Ability } from '@app/casl/ability.decorator';
import type { AppAbility } from '@app/casl/ability.factory';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
import { Controller, Get, Param, Delete, HttpCode } from '@nestjs/common';
import { ResourceTypes } from '@app/resource-enrichers';
import { ShareService } from './share.service';

@Controller('checklists/:checklistId/shares')
export class ChecklistShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  async list(
    @Param('checklistId') checklistId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    const shares = await this.shareService.listShares(checklistId, ability);
    return linkFactory
      .buildResource('checklist-shares')
      .toResource({ checklistId, shares });
  }

  @Get(':shareId')
  async findOne(
    @Param('checklistId') checklistId: string,
    @Param('shareId') shareId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory<ResourceTypes>,
  ) {
    const share = await this.shareService.getShare(
      checklistId,
      shareId,
      ability,
    );
    return linkFactory.buildResource('share').toResource({
      userId: share.userId,
      title: share.title,
      createdAt: share.createdAt,
    });
  }

  @Delete(':shareId')
  @HttpCode(204)
  async remove(
    @Param('checklistId') checklistId: string,
    @Param('shareId') shareId: string,
    @Ability() ability: AppAbility,
  ): Promise<void> {
    await this.shareService.removeShare(checklistId, shareId, ability);
  }
}
