import type { AuthUser } from '@app/auth/auth.guard';
import { User } from '@app/auth/user.decorator';
import { Hateoas, NestLinkFactory } from '@app/hateoas-nest';
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
    @User() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @Hateoas() linkFactory: NestLinkFactory,
  ) {
    const invitationId = await this.invitationService.createInvitation(
      checklistId,
      dto.title,
      user.uid,
    );
    res.setHeader(
      'location',
      linkFactory.toHandler(ChecklistInvitationController, 'findOne', {
        params: { checklistId, id: invitationId },
      }),
    );
  }

  @Get(':id')
  findOne(): void {
    // Placeholder for future implementation
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
