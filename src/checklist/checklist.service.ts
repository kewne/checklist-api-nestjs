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
  ) { }

  async create(createChecklistDto: CreateChecklistDto): Promise<Checklist> {
    return this.repository.save(createChecklistDto);
  }

  async findAll() {
    return this.repository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} checklist`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateChecklistDto: UpdateChecklistDto) {
    return `This action updates a #${id} checklist`;
  }

  remove(id: number) {
    return `This action removes a #${id} checklist`;
  }
}
