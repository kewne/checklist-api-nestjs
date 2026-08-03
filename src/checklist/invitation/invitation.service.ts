import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import type { AppAbility } from '@app/casl/ability.factory';
import {
  ChecklistDocument,
  ChecklistRepository,
} from '../checklist.repository';
import {
  InvitationDocument,
  InvitationRepository,
} from './invitation.repository';
import { ShareDocument, ShareRepository } from '../share.repository';
import { ShareService } from '../share.service';

export interface InvitationView {
  title: string;
  checklistTitle: string;
  checklistCreatedBy: string;
  checklistShares: ShareDocument[];
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly shareService: ShareService,
    private readonly shareRepository: ShareRepository,
  ) {}

  async getInvitation(
    checklistId: string,
    invitationId: string,
  ): Promise<InvitationView> {
    const invitation = await this.invitationRepository.findById(
      checklistId,
      invitationId,
    );
    if (!invitation) {
      throw new NotFoundException();
    }

    const [checklist, shares] = await Promise.all([
      this.checklistRepository.findById(checklistId),
      this.shareRepository.findByChecklist(checklistId),
    ]);
    if (!checklist) {
      throw new NotFoundException();
    }

    return {
      title: invitation.title,
      checklistTitle: checklist.title,
      checklistCreatedBy: checklist.createdBy,
      checklistShares: shares,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    };
  }

  async listInvitations(
    checklistId: string,
    ability: AppAbility,
  ): Promise<InvitationDocument[]> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    ForbiddenError.from(ability).throwUnlessCan(
      'read',
      subject('ChecklistShareInvitation', { checklist }),
    );
    return this.invitationRepository.findByChecklist(checklistId);
  }

  async createInvitation(
    checklistId: string,
    title: string,
    check?: (checklist: ChecklistDocument) => void,
  ): Promise<string> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    check?.(checklist);
    return this.invitationRepository.create(checklistId, title);
  }

  async acceptInvitation(
    checklistId: string,
    invitationId: string,
    callerUid: string,
  ): Promise<void> {
    const invitation = await this.invitationRepository.findById(
      checklistId,
      invitationId,
    );
    if (!invitation) {
      throw new NotFoundException();
    }

    if (Date.now() > invitation.expiresAt.getTime()) {
      throw new GoneException();
    }

    await this.shareService.createShare(
      checklistId,
      callerUid,
      invitation.title,
    );
    await this.invitationRepository.delete(checklistId, invitationId);
  }

  async deleteInvitation(
    checklistId: string,
    invitationId: string,
    ability: AppAbility,
  ): Promise<void> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    ForbiddenError.from(ability).throwUnlessCan(
      'delete',
      subject('ChecklistShareInvitation', { checklist }),
    );
    await this.invitationRepository.delete(checklistId, invitationId);
  }
}
