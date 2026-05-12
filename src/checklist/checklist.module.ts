import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { UserChecklistController } from './user-checklist.controller';
import { ChecklistService } from './checklist.service';
import { ChecklistRepository } from './checklist.repository';
import { HateoasModule } from '@app/hateoas/hateoas.module';

@Module({
  controllers: [ChecklistController, UserChecklistController],
  providers: [ChecklistService, ChecklistRepository],
  imports: [HateoasModule],
  exports: [ChecklistRepository],
})
export class ChecklistModule {}
