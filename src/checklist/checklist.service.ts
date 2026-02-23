import { Injectable } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { ChecklistDocument, ChecklistRepository } from './checklist.repository';

@Injectable()
export class ChecklistService {
  constructor(private repository: ChecklistRepository) {}

  async create(
    createChecklistDto: CreateChecklistDto,
  ): Promise<ChecklistDocument> {
    return this.repository.create(createChecklistDto);
  }

  async findAll(): Promise<ChecklistDocument[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<ChecklistDocument | null> {
    return this.repository.findById(id);
  }

  async update(
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<ChecklistDocument | null> {
    return this.repository.update(id, updateChecklistDto);
  }

  async remove(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
