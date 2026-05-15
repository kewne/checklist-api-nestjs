import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChecklistRepository } from './checklist.repository';
import { InvitationRepository } from './invitation.repository';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  async createInvitation(
    checklistId: string,
    title: string,
    callerUid: string,
  ): Promise<string> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    if (checklist.createdBy !== callerUid) {
      throw new ForbiddenException();
    }

    return this.invitationRepository.create(checklistId, title);
  }
}
