import {
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreModule } from '../../firestore.module';
import { ChecklistRepository } from '../checklist.repository';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';
import { ShareRepository } from '../share.repository';
import { ShareService } from '../share.service';

describe('InvitationService with Firestore Emulator', () => {
  let service: InvitationService;
  let checklistRepository: ChecklistRepository;
  let invitationRepository: InvitationRepository;
  let shareRepository: ShareRepository;

  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';

  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FirestoreModule],
      providers: [
        InvitationService,
        InvitationRepository,
        ChecklistRepository,
        ShareService,
        ShareRepository,
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    checklistRepository = module.get<ChecklistRepository>(ChecklistRepository);
    invitationRepository =
      module.get<InvitationRepository>(InvitationRepository);
    shareRepository = module.get<ShareRepository>(ShareRepository);
  });

  describe('createInvitation', () => {
    it('should create an invitation', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      const result = await service.createInvitation(
        checklistId,
        'My Invite',
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.createInvitation('non-existent-id', 'My Invite'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptInvitation', () => {
    it('should create a share and delete the invitation on success', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'Test Invite',
      );

      await service.acceptInvitation(checklistId, invitationId, otherUid);

      expect(
        await invitationRepository.findById(checklistId, invitationId),
      ).toBeNull();
      const shares = await shareRepository.findByChecklist(checklistId);
      expect(shares.some((s) => s.userId === otherUid)).toBe(true);
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      await expect(
        service.acceptInvitation(checklistId, 'non-existent', otherUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException when invitation is expired', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const expiredDate = new Date(Date.now() - 1);
      const invitationId = await invitationRepository.create(
        checklistId,
        'Expired Invite',
        expiredDate,
      );

      await expect(
        service.acceptInvitation(checklistId, invitationId, otherUid),
      ).rejects.toThrow(GoneException);
    });
  });
});
