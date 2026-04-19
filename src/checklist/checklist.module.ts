import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { InstanceController } from './instance.controller';
import { UserChecklistController } from './user-checklist.controller';
import { ChecklistService } from './checklist.service';
import { InstanceService } from './instance.service';
import { ChecklistRepository } from './checklist.repository';
import { InstanceRepository } from './instance.repository';
import { HateoasModule } from '@app/hateoas/hateoas.module';

@Module({
  controllers: [ChecklistController, InstanceController, UserChecklistController],
  providers: [ChecklistService, InstanceService, ChecklistRepository, InstanceRepository],
  imports: [HateoasModule],
  exports: [ChecklistRepository, InstanceRepository],
})
export class ChecklistModule {}
