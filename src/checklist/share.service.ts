import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import { AppAbility } from '../casl/ability.factory';
import { ChecklistDocument, ChecklistRepository } from './checklist.repository';
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
    title: string,
  ): Promise<string> {
    const alreadyShared = await this.shareRepository.existsByChecklistAndUser(
      checklistId,
      userId,
    );
    if (alreadyShared) {
      throw new ConflictException(
        `Checklist ${checklistId} is already shared with user ${userId}`,
      );
    }

    return this.shareRepository.create(checklistId, userId, title);
  }

  async listShares(
    checklistId: string,
    ability: AppAbility,
  ): Promise<ShareDocument[]> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    ForbiddenError.from(ability).throwUnlessCan(
      'read',
      subject('ChecklistShare', { checklist }),
    );

    return this.shareRepository.findByChecklist(checklistId);
  }

  async getShare(
    checklistId: string,
    shareId: string,
    ability: AppAbility,
  ): Promise<ShareDocument> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    ForbiddenError.from(ability).throwUnlessCan(
      'read',
      subject('ChecklistShare', { checklist }),
    );

    const share = await this.shareRepository.findById(checklistId, shareId);
    if (!share) {
      throw new NotFoundException(`Share ${shareId} not found`);
    }
    return share;
  }

  async removeShare(
    checklistId: string,
    shareId: string,
    ability: AppAbility,
  ): Promise<void> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${checklistId} not found`);
    }
    ForbiddenError.from(ability).throwUnlessCan(
      'delete',
      subject('ChecklistShare', { checklist }),
    );

    await this.shareRepository.delete(checklistId, shareId);
  }

  async listSharedWithUser(userId: string): Promise<ShareDocument[]> {
    return this.shareRepository.findByUserId(userId);
  }

  async listChecklistsSharedWithUser(
    userId: string,
    ability: AppAbility,
  ): Promise<ChecklistDocument[]> {
    ForbiddenError.from(ability).throwUnlessCan(
      'read',
      subject('ChecklistsSharedWithUser', { userId }),
    );
    const shares = await this.shareRepository.findByUserId(userId);
    const ids = shares.map((s) => s.checklistId);
    return this.checklistRepository.findByIds(ids);
  }
}
