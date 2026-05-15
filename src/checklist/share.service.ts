import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChecklistRepository } from './checklist.repository';
import { ShareDocument, ShareRepository } from './share.repository';

@Injectable()
export class ShareService {
  constructor(
    private readonly shareRepository: ShareRepository,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  async createShare(
    checklistId: string,
    userId: string,
    callerUid: string,
  ): Promise<string> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    if (checklist.createdBy !== callerUid) {
      throw new ForbiddenException();
    }

    const alreadyShared = await this.shareRepository.existsByChecklistAndUser(
      checklistId,
      userId,
    );
    if (alreadyShared) {
      throw new ConflictException(
        `Checklist ${checklistId} is already shared with user ${userId}`,
      );
    }

    return this.shareRepository.create(checklistId, userId);
  }

  async listShares(
    checklistId: string,
    callerUid: string,
  ): Promise<ShareDocument[]> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    if (checklist.createdBy !== callerUid) {
      throw new ForbiddenException();
    }

    return this.shareRepository.findByChecklist(checklistId);
  }

  async removeShare(
    checklistId: string,
    shareId: string,
    callerUid: string,
  ): Promise<void> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    if (checklist.createdBy !== callerUid) {
      throw new ForbiddenException();
    }

    await this.shareRepository.delete(checklistId, shareId);
  }

  async listSharedWithUser(userId: string): Promise<ShareDocument[]> {
    return this.shareRepository.findByUserId(userId);
  }
}
