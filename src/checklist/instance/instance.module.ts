import { Module } from '@nestjs/common';
import { HateoasModule } from '@app/hateoas/hateoas.module';
import { ChecklistInstanceController } from './checklist-instance.controller';
import { UserChecklistInstanceController } from './user-checklist-instance.controller';
import { InstanceService } from './instance.service';
import { InstanceRepository } from './instance.repository';
import { ChecklistModule } from '../checklist.module';

@Module({
  imports: [HateoasModule, ChecklistModule],
  controllers: [ChecklistInstanceController, UserChecklistInstanceController],
  providers: [InstanceService, InstanceRepository],
  exports: [InstanceService, InstanceRepository],
})
export class InstanceModule {}
