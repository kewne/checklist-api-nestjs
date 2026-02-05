import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { InstanceController } from './instance.controller';
import { Checklist } from './checklist.entity';
import { ChecklistInstance } from './checklist-instance.entity';
import { ChecklistService } from './checklist.service';
import { InstanceService } from './instance.service';

@Module({
  controllers: [ChecklistController, InstanceController],
  providers: [ChecklistService, InstanceService],
  imports: [TypeOrmModule.forFeature([Checklist, ChecklistInstance])],
})
export class ChecklistModule {}
