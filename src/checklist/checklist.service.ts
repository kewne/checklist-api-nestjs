import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checklist } from './checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(Checklist)
    private repository: Repository<Checklist>,
  ) {}

  async create(createChecklistDto: CreateChecklistDto) {
    const result = await this.repository.insert(createChecklistDto);
    return result.identifiers[0];
  }

  async findAll(): Promise<Checklist[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Checklist | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<Checklist | null> {
    await this.repository.update(id, updateChecklistDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
