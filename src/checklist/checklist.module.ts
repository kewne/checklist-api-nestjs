import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { InstanceController } from './instance.controller';
import { ChecklistService } from './checklist.service';
import { InstanceService } from './instance.service';
import { ChecklistRepository } from './checklist.repository';
import { InstanceRepository } from './instance.repository';
import { HateoasModule } from '@app/hateoas/hateoas.module';

@Module({
  controllers: [ChecklistController, InstanceController],
  providers: [ChecklistService, InstanceService, ChecklistRepository, InstanceRepository],
  imports: [HateoasModule],
  exports: [ChecklistRepository, InstanceRepository],
})
export class ChecklistModule {}
