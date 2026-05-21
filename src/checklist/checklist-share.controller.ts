import { Ability } from '@app/casl/ability.decorator';
import type { AppAbility } from '@app/casl/ability.factory';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import { Controller, Get, Param } from '@nestjs/common';
import { ChecklistInvitationController } from './invitation/checklist-invitation.controller';
import { ShareService } from './share.service';

@Controller('checklists/:checklistId/shares')
export class ChecklistShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  async list(
    @Param('checklistId') checklistId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const shares = await this.shareService.listShares(checklistId, ability);
    return linkFactory
      .buildResource()
      .withRel(
        'items',
        ...shares.map((share) =>
          toHandlerCall({
            controller: ChecklistShareController,
            title: share.title,
          }).findOne({ params: { checklistId, shareId: share.id } }),
        ),
      )
      .withRel(
        'related',
        toHandlerCall({
          controller: ChecklistInvitationController,
          name: 'invitations',
        }).list({ params: { checklistId } }),
      )
      .toResource({});
  }

  @Get(':shareId')
  async findOne(
    @Param('checklistId') checklistId: string,
    @Param('shareId') shareId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const share = await this.shareService.getShare(
      checklistId,
      shareId,
      ability,
    );
    return linkFactory.buildResource().toResource({
      userId: share.userId,
      title: share.title,
      createdAt: share.createdAt,
    });
  }
}
