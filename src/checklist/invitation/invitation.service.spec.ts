import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenError } from '@casl/ability';
import { FirestoreModule } from '../../firestore.module';
import { AbilityFactory } from '../../casl/ability.factory';
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
  const abilityFactory = new AbilityFactory();

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

  describe('listInvitations', () => {
    it('should return invitations ordered newest first', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const firstId = await invitationRepository.create(checklistId, 'First');
      const secondId = await invitationRepository.create(checklistId, 'Second');

      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });
      const result = await service.listInvitations(checklistId, ownerAbility);

      expect(result.map((i) => i.id)).toEqual([secondId, firstId]);
    });

    it('should return empty array when checklist has no invitations', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });
      const result = await service.listInvitations(checklistId, ownerAbility);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await expect(
        service.listInvitations('non-existent-id', ownerAbility),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenError when caller is not the checklist owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const nonOwnerAbility = abilityFactory.createForUser({ uid: otherUid });

      await expect(
        service.listInvitations(checklistId, nonOwnerAbility),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createInvitation', () => {
    it('should create an invitation', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      const result = await service.createInvitation(checklistId, 'My Invite');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.createInvitation('non-existent-id', 'My Invite'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvitation', () => {
    it('should return enriched view with checklistCreatedBy and checklistShares', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'My Invite',
      );

      const result = await service.getInvitation(checklistId, invitationId);

      expect(result.checklistCreatedBy).toBe(ownerUid);
      expect(result.checklistShares).toEqual([]);
    });

    it('should include existing shares in checklistShares', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'My Invite',
      );
      await shareRepository.create(checklistId, otherUid, 'Shared');

      const result = await service.getInvitation(checklistId, invitationId);

      expect(result.checklistShares.map((s) => s.userId)).toContain(otherUid);
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      await expect(
        service.getInvitation(checklistId, 'non-existent'),
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
      const share = shares.find((s) => s.userId === otherUid);
      expect(share).toBeDefined();
      expect(share!.title).toBe('Test Invite');
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

  describe('deleteInvitation', () => {
    it('should delete an invitation when caller is the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'Test Invite',
      );
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await service.deleteInvitation(checklistId, invitationId, ownerAbility);

      expect(
        await invitationRepository.findById(checklistId, invitationId),
      ).toBeNull();
    });

    it('should throw ForbiddenError when caller is not the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'Test Invite',
      );
      const nonOwnerAbility = abilityFactory.createForUser({ uid: otherUid });

      await expect(
        service.deleteInvitation(checklistId, invitationId, nonOwnerAbility),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should not throw when deleting non-existent invitation (idempotency)', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await expect(
        service.deleteInvitation(checklistId, 'non-existent-id', ownerAbility),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await expect(
        service.deleteInvitation(
          'non-existent-checklist',
          'some-id',
          ownerAbility,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('dismissInvitation', () => {
    it('should delete the invitation', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const invitationId = await invitationRepository.create(
        checklistId,
        'Test Invite',
      );

      await service.dismissInvitation(checklistId, invitationId);

      expect(
        await invitationRepository.findById(checklistId, invitationId),
      ).toBeNull();
    });

    it('should not throw when invitation does not exist (idempotency)', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      await expect(
        service.dismissInvitation(checklistId, 'non-existent-id'),
      ).resolves.not.toThrow();
    });
  });
});
