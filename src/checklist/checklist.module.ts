import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checklist } from './entities/checklist.entity';

@Module({
  controllers: [ChecklistController],
  providers: [ChecklistService],
  imports: [TypeOrmModule.forFeature([Checklist])],
})
export class ChecklistModule {}
