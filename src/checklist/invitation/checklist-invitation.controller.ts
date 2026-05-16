import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Ability } from '@app/casl/ability.decorator';
import type { AppAbility } from '@app/casl/ability.factory';
import { Hateoas, NestLinkFactory, toHandlerCall } from '@app/hateoas-nest';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import { type Response } from 'express';
import { CreateShareInvitationDto } from './create-share-invitation.dto';
import { InvitationService } from './invitation.service';

@Controller('checklists/:checklistId/invitations')
export class ChecklistInvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Param('checklistId') checklistId: string,
    @Body() dto: CreateShareInvitationDto,
    @Ability() ability: AppAbility,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const invitationId = await this.invitationService.createInvitation(
      checklistId,
      dto.title,
      (checklist) => {
        ForbiddenError.from(ability).throwUnlessCan(
          'create',
          subject('ChecklistShareInvitation', { checklist }),
        );
      },
    );
    res.setHeader(
      'location',
      linkFactory.toHandler(ChecklistInvitationController, 'findOne', {
        params: { checklistId, id: invitationId },
      }),
    );
  }

  @Get()
  async list(
    @Param('checklistId') checklistId: string,
    @Ability() ability: AppAbility,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const invitations = await this.invitationService.listInvitations(
      checklistId,
      ability,
    );
    return linkFactory
      .buildResource()
      .withRel(
        'create',
        toHandlerCall({
          controller: ChecklistInvitationController,
        }).create({ params: { checklistId } }),
      )
      .withRel(
        'items',
        ...invitations.map((inv) => {
          const isExpired = Date.now() > inv.expiresAt.getTime();
          return toHandlerCall({
            controller: ChecklistInvitationController,
            title: isExpired ? `${inv.title} (expired)` : inv.title,
          }).findOne({ params: { checklistId, id: inv.id } });
        }),
      )
      .toResource({});
  }

  @Get(':id')
  async findOne(
    @Param('checklistId') checklistId: string,
    @Param('id') id: string,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const view = await this.invitationService.getInvitation(checklistId, id);
    const isExpired = Date.now() > view.expiresAt.getTime();
    let builder = linkFactory.buildResource();
    if (!isExpired) {
      builder = builder.withRel(
        'accept',
        toHandlerCall({
          controller: ChecklistInvitationController,
        }).accept({ params: { checklistId, id } }),
      );
    }
    return builder.toResource({
      title: view.checklistTitle,
      expiresAt: view.expiresAt,
    });
  }

  @Post(':id/accept')
  @HttpCode(204)
  async accept(
    @Param('checklistId') checklistId: string,
    @Param('id') invitationId: string,
    @User() user: AuthUser,
  ): Promise<void> {
    await this.invitationService.acceptInvitation(
      checklistId,
      invitationId,
      user.uid,
    );
  }
}
