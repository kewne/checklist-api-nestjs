import { Injectable, NotFoundException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { InstanceRepository, ChecklistInstanceDocument } from './instance.repository';

@Injectable()
export class InstanceService {
  constructor(
    private instanceRepository: InstanceRepository,
    private checklistService: ChecklistService,
  ) {}

  async createInstance(
    checklistId: string,
    userId: string,
    title?: string,
  ): Promise<ChecklistInstanceDocument> {
    const checklist = await this.checklistService.findOne(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist with id ${checklistId} not found`);
    }

    const now = new Date();
    const resolvedTitle = title ?? `${checklist.title} - ${now.toISOString()}`;

    return this.instanceRepository.create(checklistId, userId, resolvedTitle, checklist.items);
  }
}
