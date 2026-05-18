import { ForbiddenError } from '@casl/ability';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from '../casl/ability.factory';
import { FirestoreModule } from '../firestore.module';
import { ChecklistRepository } from './checklist.repository';
import { ShareRepository } from './share.repository';
import { ShareService } from './share.service';

describe('ShareService with Firestore Emulator', () => {
  let service: ShareService;
  let checklistRepository: ChecklistRepository;
  let shareRepository: ShareRepository;

  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const userId = 'recipient-uid';
  const abilityFactory = new AbilityFactory();

  beforeAll(() => {
    // Set up Firestore to use emulator
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FirestoreModule],
      providers: [ShareService, ShareRepository, ChecklistRepository],
    }).compile();

    service = module.get<ShareService>(ShareService);
    checklistRepository = module.get<ChecklistRepository>(ChecklistRepository);
    shareRepository = module.get<ShareRepository>(ShareRepository);
  });

  describe('createShare', () => {
    it('should create a share', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      const result = await service.createShare(checklistId, userId);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      const shares = await shareRepository.findByChecklist(checklistId);
      expect(shares).toHaveLength(1);
      expect(shares[0].userId).toBe(userId);
    });

    it('should throw ConflictException when share already exists', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId);

      await expect(service.createShare(checklistId, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('listShares', () => {
    it('should return shares when caller is the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId);

      const shares = await service.listShares(
        checklistId,
        abilityFactory.createForUser({ uid: ownerUid }),
      );

      expect(shares).toHaveLength(1);
      expect(shares[0].userId).toBe(userId);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.listShares(
          'non-existent-id',
          abilityFactory.createForUser({ uid: ownerUid }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenError when caller is not the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      await expect(
        service.listShares(
          checklistId,
          abilityFactory.createForUser({ uid: otherUid }),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return empty array when no shares exist', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      const shares = await service.listShares(
        checklistId,
        abilityFactory.createForUser({ uid: ownerUid }),
      );

      expect(shares).toEqual([]);
    });
  });

  describe('removeShare', () => {
    it('should delete a share when caller is the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const createdShareId = await service.createShare(checklistId, userId);

      await service.removeShare(checklistId, createdShareId, ownerUid);

      const shares = await service.listShares(
        checklistId,
        abilityFactory.createForUser({ uid: ownerUid }),
      );
      expect(shares).toHaveLength(0);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.removeShare('non-existent-id', 'some-share-id', ownerUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );

      await expect(
        service.removeShare(checklistId, 'some-share-id', otherUid),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listSharedWithUser', () => {
    it('should return shares for the given user', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const { id: otherChecklistId } = await checklistRepository.create(
        { title: 'My Other Checklist' },
        ownerUid,
      );

      await service.createShare(checklistId, userId);
      await service.createShare(otherChecklistId, userId);

      const shares = await service.listSharedWithUser(userId);

      expect(shares.length).toBeGreaterThanOrEqual(2);
      expect(shares.map((s) => s.checklistId)).toEqual(
        expect.arrayContaining([checklistId, otherChecklistId]),
      );
    });

    it('should return empty array when no checklists are shared with the user', async () => {
      const shares = await service.listSharedWithUser('unknown-user');

      expect(shares).toEqual([]);
    });
  });
});
