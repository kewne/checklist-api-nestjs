import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
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
    createInstanceDto: CreateChecklistInstanceDto,
  ): Promise<ChecklistInstanceDocument> {
    const checklist = await this.checklistService.findOne(checklistId);
    if (!checklist) {
      throw new NotFoundException(`Checklist with id ${checklistId} not found`);
    }

    return this.instanceRepository.create(checklistId, createInstanceDto);
  }
}
