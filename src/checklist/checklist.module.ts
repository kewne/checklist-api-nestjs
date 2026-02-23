import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { InstanceController } from './instance.controller';
import { ChecklistInstance } from './checklist-instance.entity';
import { ChecklistService } from './checklist.service';
import { InstanceService } from './instance.service';
import { ChecklistRepository } from './checklist.repository';
import { HateoasModule } from '@app/hateoas/hateoas.module';

@Module({
  controllers: [ChecklistController, InstanceController],
  providers: [ChecklistService, InstanceService, ChecklistRepository],
  imports: [
    TypeOrmModule.forFeature([ChecklistInstance]),
    HateoasModule,
  ],
  exports: [ChecklistRepository],
})
export class ChecklistModule {}
