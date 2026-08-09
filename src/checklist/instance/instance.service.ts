import { Injectable, NotFoundException } from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import { ChecklistService } from '../checklist.service';
import { AppAbility } from '../../casl/ability.factory';
import {
  ChecklistInstance,
  ReplaceChecklistInstanceDto,
} from './dto';
import { CreateItemDto } from '../dto/create-item.dto';
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
  ) {}

  async createInstance(
    checklistId: string,
    userId: string,
    title?: string,
  ): Promise<string> {
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

  async createFromData(
    userId: string,
    dto: ChecklistInstance,
  ) {
    return this.instanceRepository.createFromData(userId, dto.title, dto.items);
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
    ability?: AppAbility,
  ): Promise<void> {
    const instance = await this.findOne(instanceId);
    if (ability) {
      ForbiddenError.from(ability).throwUnlessCan(
        'update',
        subject('ChecklistInstance', instance),
      );
    }
    await this.instanceRepository.completeItem(
      instanceId,
      itemId,
      new Date().toISOString(),
      note,
    );
  }

  async markItemIncomplete(
    instanceId: string,
    itemId: string,
    ability?: AppAbility,
  ): Promise<void> {
    const instance = await this.findOne(instanceId);
    if (ability) {
      ForbiddenError.from(ability).throwUnlessCan(
        'update',
        subject('ChecklistInstance', instance),
      );
    }
    await this.instanceRepository.markItemIncomplete(instanceId, itemId);
  }

  async remove(
    id: string,
    ability?: AppAbility,
  ): Promise<void> {
    const instance = await this.findOne(id);
    if (ability) {
      ForbiddenError.from(ability).throwUnlessCan(
        'delete',
        subject('ChecklistInstance', instance),
      );
    }
    await this.instanceRepository.delete(id);
  }

  async replace(
    instanceId: string,
    dto: ReplaceChecklistInstanceDto,
    ability?: AppAbility,
  ): Promise<void> {
    const instance = await this.findOne(instanceId);
    if (ability) {
      ForbiddenError.from(ability).throwUnlessCan(
        'update',
        subject('ChecklistInstance', instance),
      );
    }
    return this.instanceRepository.replace(instanceId, dto);
  }

  async addItem(
    instanceId: string,
    dto: CreateItemDto,
    authCheck?: (instance: ChecklistInstanceDocument) => void,
  ): Promise<ChecklistInstanceDocument> {
    const instance = await this.findOne(instanceId);
    authCheck?.(instance);
    return this.instanceRepository.addItem(instanceId, dto);
  }
}
