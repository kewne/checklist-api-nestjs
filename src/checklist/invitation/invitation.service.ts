import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChecklistDocument,
  ChecklistRepository,
} from '../checklist.repository';
import { InvitationRepository } from './invitation.repository';
import { ShareService } from '../share.service';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly shareService: ShareService,
  ) {}

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

    await this.shareService.createShare(checklistId, callerUid);
    await this.invitationRepository.delete(checklistId, invitationId);
  }
}
