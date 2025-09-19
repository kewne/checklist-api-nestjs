import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { Checklist } from './checklist.entity';
import { ChecklistService } from './checklist.service';

@Module({
  controllers: [ChecklistController],
  providers: [ChecklistService],
  imports: [TypeOrmModule.forFeature([Checklist])],
})
export class ChecklistModule { }
