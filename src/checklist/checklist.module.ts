import { HateoasModule } from '@app/hateoas/hateoas.module';
import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { ChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';
import { UserChecklistController } from './user-checklist.controller';

@Module({
  controllers: [ChecklistController, UserChecklistController],
  providers: [ChecklistService, ChecklistRepository],
  imports: [HateoasModule],
  exports: [ChecklistService],
})
export class ChecklistModule {}
