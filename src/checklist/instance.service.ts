import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistInstance } from './checklist-instance.entity';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { ChecklistService } from './checklist.service';

@Injectable()
export class InstanceService {
  constructor(
    @InjectRepository(ChecklistInstance)
    private instanceRepository: Repository<ChecklistInstance>,
    private checklistService: ChecklistService,
  ) {}

  async createInstance(
    checklistId: number,
    createInstanceDto: CreateChecklistInstanceDto,
  ): Promise<Pick<ChecklistInstance, 'id'>> {
    const checklist = await this.checklistService.findOne(checklistId.toString());
    if (!checklist) {
      throw new NotFoundException(`Checklist with id ${checklistId} not found`);
    }

    const instance = await this.instanceRepository.save({
      checklistId,
      ...createInstanceDto,
    });
    return instance;
  }
}
