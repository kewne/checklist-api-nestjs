import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';
import { ChecklistDocument, ChecklistRepository } from './checklist.repository';

@Injectable()
export class ChecklistService {
  constructor(private repository: ChecklistRepository) {}

  async create(
    createChecklistDto: CreateChecklistDto,
    createdByUserId: string,
  ): Promise<ChecklistDocument> {
    return this.repository.create(createChecklistDto, createdByUserId);
  }

  async findAll(): Promise<ChecklistDocument[]> {
    return this.repository.findAll();
  }

  async findAllByUser(userId: string): Promise<ChecklistDocument[]> {
    return this.repository.findCreatedBy(userId);
  }

  async findOne(id: string): Promise<ChecklistDocument | null> {
    return this.repository.findById(id);
  }

  async remove(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async replace(
    id: string,
    replaceChecklistDto: ReplaceChecklistDto,
  ): Promise<ChecklistDocument> {
    const result = await this.repository.replace(id, replaceChecklistDto);
    if (!result) {
      throw new NotFoundException(`Checklist ${id} not found`);
    }
    return result;
  }
}
