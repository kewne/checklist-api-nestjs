import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { UserChecklistController } from './user-checklist.controller';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { ChecklistService } from './checklist.service';
import { InstanceService } from './instance.service';
import { ChecklistRepository } from './checklist.repository';
import { InstanceRepository } from './instance.repository';
import { HateoasModule } from '@app/hateoas/hateoas.module';

@Module({
  controllers: [ChecklistController, UserChecklistController, UserChecklistInstanceController, ChecklistInstanceController],
  providers: [ChecklistService, InstanceService, ChecklistRepository, InstanceRepository],
  imports: [HateoasModule],
  exports: [ChecklistRepository, InstanceRepository],
})
export class ChecklistModule {}
