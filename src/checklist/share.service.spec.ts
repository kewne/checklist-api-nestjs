import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Firestore } from '@google-cloud/firestore';
import { ChecklistRepository } from './checklist.repository';
import { ShareRepository } from './share.repository';
import { ShareService } from './share.service';
import { FirestoreModule } from '../firestore.module';

describe('ShareService with Firestore Emulator', () => {
  let service: ShareService;
  let shareRepository: ShareRepository;
  let firestore: Firestore;

  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const checklistId = 'checklist-1';
  const userId = 'recipient-uid';

  const mockChecklist = {
    id: checklistId,
    title: 'My Checklist',
    items: [],
    createdBy: ownerUid,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    shareRepository = module.get<ShareRepository>(ShareRepository);
    firestore = module.get<Firestore>(Firestore);

    // Create test checklist
    await firestore
      .collection('checklists')
      .doc(checklistId)
      .set(mockChecklist);
  });

  afterEach(async () => {
    // Clean up test data
    const checklists = await firestore.collection('checklists').get();
    for (const doc of checklists.docs) {
      const shares = await doc.ref.collection('shares').get();
      for (const shareDoc of shares.docs) {
        await shareDoc.ref.delete();
      }
      await doc.ref.delete();
    }
  });

  describe('createShare', () => {
    it('should create a share when caller is the owner and no existing share', async () => {
      const result = await service.createShare(checklistId, userId, ownerUid);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      // Verify share was created
      const shares = await shareRepository.findByChecklist(checklistId);
      expect(shares).toHaveLength(1);
      expect(shares[0].userId).toBe(userId);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.createShare('non-existent-id', userId, ownerUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      await expect(
        service.createShare(checklistId, userId, otherUid),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when share already exists', async () => {
      // Create first share
      await service.createShare(checklistId, userId, ownerUid);

      // Attempt to create duplicate
      await expect(
        service.createShare(checklistId, userId, ownerUid),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listShares', () => {
    it('should return shares when caller is the owner', async () => {
      // Create a share
      await service.createShare(checklistId, userId, ownerUid);

      const shares = await service.listShares(checklistId, ownerUid);

      expect(shares).toHaveLength(1);
      expect(shares[0].userId).toBe(userId);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.listShares('non-existent-id', ownerUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      await expect(service.listShares(checklistId, otherUid)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return empty array when no shares exist', async () => {
      const shares = await service.listShares(checklistId, ownerUid);

      expect(shares).toEqual([]);
    });
  });

  describe('removeShare', () => {
    it('should delete a share when caller is the owner', async () => {
      // Create a share
      const createdShareId = await service.createShare(
        checklistId,
        userId,
        ownerUid,
      );

      // Remove it
      await service.removeShare(checklistId, createdShareId, ownerUid);

      // Verify it was deleted
      const shares = await service.listShares(checklistId, ownerUid);
      expect(shares).toHaveLength(0);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      await expect(
        service.removeShare('non-existent-id', 'some-share-id', ownerUid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      await expect(
        service.removeShare(checklistId, 'some-share-id', otherUid),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listSharedWithUser', () => {
    it('should return shares for the given user', async () => {
      // Create shares for multiple checklists
      const otherChecklistId = 'checklist-2';
      await firestore
        .collection('checklists')
        .doc(otherChecklistId)
        .set({
          ...mockChecklist,
          id: otherChecklistId,
        });

      await service.createShare(checklistId, userId, ownerUid);
      await service.createShare(otherChecklistId, userId, ownerUid);

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
