import { HateoasModule } from '@app/hateoas/hateoas.module';
import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { ChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';
import { ChecklistShareController } from './checklist-share.controller';
import { ShareRepository } from './share.repository';
import { ShareService } from './share.service';
import { UserChecklistController } from './user-checklist.controller';

@Module({
  controllers: [ChecklistController, UserChecklistController, ChecklistShareController],
  providers: [
    ChecklistService,
    ChecklistRepository,
    ShareService,
    ShareRepository,
  ],
  imports: [HateoasModule],
  exports: [ChecklistService, ShareService, ChecklistRepository],
})
export class ChecklistModule {}
