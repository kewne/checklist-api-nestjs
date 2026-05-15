import { HateoasModule } from '@app/hateoas/hateoas.module';
import { Module } from '@nestjs/common';
import { ChecklistInvitationController } from './checklist-invitation.controller';
import { ChecklistController } from './checklist.controller';
import { ChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';
import { ShareRepository } from './share.repository';
import { ShareService } from './share.service';
import { UserChecklistController } from './user-checklist.controller';

@Module({
  controllers: [
    ChecklistController,
    UserChecklistController,
    ChecklistInvitationController,
  ],
  providers: [
    ChecklistService,
    ChecklistRepository,
    ShareService,
    ShareRepository,
    InvitationService,
    InvitationRepository,
  ],
  imports: [HateoasModule],
  exports: [ChecklistService, ShareService],
})
export class ChecklistModule {}
