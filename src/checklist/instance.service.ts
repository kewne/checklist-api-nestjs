import { Injectable, NotFoundException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import {
  ChecklistInstanceDocument,
  ChecklistListItem,
  InstanceRepository,
} from './instance.repository';

@Injectable()
export class InstanceService {
  constructor(
    private instanceRepository: InstanceRepository,
    private checklistService: ChecklistService,
  ) { }

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

    return this.instanceRepository.create(
      checklistId,
      userId,
      resolvedTitle,
      checklist.items,
    );
  }

  async findCreatedBy(userId: string): Promise<ChecklistListItem[]> {
    return this.instanceRepository.findCreatedBy(userId);
  }

  async findOne(id: string): Promise<ChecklistInstanceDocument> {
    const instance = await this.instanceRepository.findById(id);
    if (!instance) {
      throw new NotFoundException(`Checklist instance with id ${id} not found`);
    }
    return instance;
  }

  async completeItem(
    instanceId: string,
    itemId: string,
    note?: string,
  ): Promise<void> {
    await this.instanceRepository.completeItem(
      instanceId,
      itemId,
      new Date().toISOString(),
      note,
    );
  }

  async markItemIncomplete(instanceId: string, itemId: string): Promise<void> {
    await this.instanceRepository.markItemIncomplete(instanceId, itemId);
  }

  async remove(id: string): Promise<void> {
    const instance = await this.instanceRepository.findById(id);
    if (!instance) {
      throw new NotFoundException(`Checklist instance with id ${id} not found`);
    }
    await this.instanceRepository.delete(id);
  }
}
