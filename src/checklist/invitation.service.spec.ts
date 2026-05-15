import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Firestore } from '@google-cloud/firestore';
import { ChecklistRepository } from './checklist.repository';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';
import { FirestoreModule } from '../firestore.module';

describe('InvitationService with Firestore Emulator', () => {
  let service: InvitationService;
  let firestore: Firestore;

  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const checklistId = 'checklist-1';

  const mockChecklist = {
    id: checklistId,
    title: 'My Checklist',
    items: [],
    createdBy: ownerUid,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FirestoreModule],
      providers: [InvitationService, InvitationRepository, ChecklistRepository],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    firestore = module.get<Firestore>(Firestore);

    await firestore
      .collection('checklists')
      .doc(checklistId)
      .set(mockChecklist);
  });

  afterEach(async () => {
    const checklists = await firestore.collection('checklists').get();
    for (const doc of checklists.docs) {
      const invitations = await doc.ref.collection('invitations').get();
      for (const invitationDoc of invitations.docs) {
        await invitationDoc.ref.delete();
      }
      await doc.ref.delete();
    }
  });

  describe('createInvitation', () => {
    it('should create an invitation when caller is the owner', async () => {
      const result = await service.createInvitation(
        checklistId,
        'My Invite',
        ownerUid,
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.createInvitation('non-existent-id', 'My Invite', ownerUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      await expect(
        service.createInvitation(checklistId, 'My Invite', otherUid),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
