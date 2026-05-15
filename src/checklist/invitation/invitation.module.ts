import { HateoasModule } from '@app/hateoas/hateoas.module';
import { Module } from '@nestjs/common';
import { ChecklistModule } from '../checklist.module';
import { ChecklistInvitationController } from './checklist-invitation.controller';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

@Module({
  imports: [HateoasModule, ChecklistModule],
  controllers: [ChecklistInvitationController],
  providers: [InvitationService, InvitationRepository],
  exports: [InvitationService],
})
export class InvitationModule {}
