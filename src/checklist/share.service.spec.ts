import { ForbiddenError } from '@casl/ability';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

  let ownerUid: string;
  let otherUid: string;
  let userId: string;
  const abilityFactory = new AbilityFactory();

  beforeAll(() => {
    // Set up Firestore to use emulator
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  beforeEach(async () => {
    ownerUid = randomUUID();
    otherUid = randomUUID();
    userId = randomUUID();

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

      const result = await service.createShare(
        checklistId,
        userId,
        'Share Title',
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      const shares = await shareRepository.findByChecklist(checklistId);
      expect(shares).toHaveLength(1);
      expect(shares[0].userId).toBe(userId);
      expect(shares[0].title).toBe('Share Title');
    });

    it('should throw ConflictException when share already exists', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId, 'Share Title');

      await expect(
        service.createShare(checklistId, userId, 'Share Title'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listShares', () => {
    it('should return shares when caller is the owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId, 'Share Title');

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
    it('should remove share when caller is owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const createdShareId = await service.createShare(
        checklistId,
        userId,
        'Share Title',
      );
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await service.removeShare(checklistId, createdShareId, ownerAbility);

      const shares = await service.listShares(
        checklistId,
        abilityFactory.createForUser({ uid: ownerUid }),
      );
      expect(shares).toHaveLength(0);
    });

    it('should throw ForbiddenError when caller is not owner', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId, 'Share Title');
      const notOwnerAbility = abilityFactory.createForUser({ uid: otherUid });

      await expect(
        service.removeShare(checklistId, 'some-share-id', notOwnerAbility),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should succeed when share does not exist (idempotency)', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'My Checklist' },
        ownerUid,
      );
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await expect(
        service.removeShare(checklistId, 'non-existent-share', ownerAbility),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      const ownerAbility = abilityFactory.createForUser({ uid: ownerUid });

      await expect(
        service.removeShare(
          'non-existent-checklist',
          'any-share',
          ownerAbility,
        ),
      ).rejects.toThrow(NotFoundException);
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

      await service.createShare(checklistId, userId, 'Share Title');
      await service.createShare(otherChecklistId, userId, 'Share Title');

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

  describe('listChecklistsSharedWithUser', () => {
    it('should return checklists shared with the user', async () => {
      const { id: checklistId } = await checklistRepository.create(
        { title: 'Shared Checklist' },
        ownerUid,
      );
      await service.createShare(checklistId, userId, 'Share Title');

      const checklists = await service.listChecklistsSharedWithUser(
        userId,
        abilityFactory.createForUser({ uid: userId }),
      );

      expect(checklists.map((c) => c.id)).toContain(checklistId);
    });

    it('should return empty array when no checklists are shared with the user', async () => {
      const checklists = await service.listChecklistsSharedWithUser(
        userId,
        abilityFactory.createForUser({ uid: userId }),
      );

      expect(checklists).toEqual([]);
    });

    it("should throw ForbiddenError when requesting another user's shared checklists", async () => {
      await expect(
        service.listChecklistsSharedWithUser(
          userId,
          abilityFactory.createForUser({ uid: otherUid }),
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
