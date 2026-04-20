import { Test, TestingModule } from '@nestjs/testing';
import { InstanceRepository } from './instance.repository';
import { Firestore } from '@google-cloud/firestore';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('InstanceRepository', () => {
  let repository: InstanceRepository;
  let firestoreMock: { collection: jest.Mock };

  beforeEach(async () => {
    firestoreMock = {
      collection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstanceRepository,
        {
          provide: Firestore,
          useValue: firestoreMock,
        },
      ],
    }).compile();

    repository = module.get<InstanceRepository>(InstanceRepository);
  });

  describe('findCreatedBy', () => {
    it('should query Firestore with correct filters and ordering', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockDocs = [
        {
          id: 'instance-1',
          data: () => ({
            checklistId: 'checklist-1',
            createdBy: userId,
            createdAt: new Date('2026-01-01T10:00:00Z'),
            title: 'First Instance',
            items: [],
          }),
        },
        {
          id: 'instance-2',
          data: () => ({
            checklistId: 'checklist-2',
            createdBy: userId,
            createdAt: new Date('2026-03-15T14:30:00Z'),
            title: 'Second Instance',
            items: [],
          }),
        },
      ];

      const mockSnapshot = {
        docs: mockDocs,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockOrderBy = jest.fn().mockReturnValue({ get: mockGet });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      firestoreMock.collection = mockCollection;

      // Act
      const result = await repository.findCreatedBy(userId);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith('checklistInstances');
      expect(mockWhere).toHaveBeenCalledWith('createdBy', '==', userId);
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('instance-1');
      expect(result[1].id).toBe('instance-2');
    });

    it('should return empty array when no instances found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockSnapshot = {
        docs: [],
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockOrderBy = jest.fn().mockReturnValue({ get: mockGet });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      firestoreMock.collection = mockCollection;

      // Act
      const result = await repository.findCreatedBy(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should correctly map document data to ChecklistInstanceDocument', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createdAtDate = new Date('2026-02-10T12:00:00Z');
      const mockDocs = [
        {
          id: 'instance-123',
          data: () => ({
            checklistId: 'checklist-456',
            createdBy: userId,
            createdAt: createdAtDate,
            title: 'Test Instance',
            items: [{ id: 'item-1', title: 'Item 1', description: 'Desc' }],
          }),
        },
      ];

      const mockSnapshot = {
        docs: mockDocs,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockOrderBy = jest.fn().mockReturnValue({ get: mockGet });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      firestoreMock.collection = mockCollection;

      // Act
      const result = await repository.findCreatedBy(userId);

      // Assert
      expect(result).toHaveLength(1);
      const instance = result[0];
      expect(instance.id).toBe('instance-123');
      expect(instance.checklistId).toBe('checklist-456');
      expect(instance.createdBy).toBe(userId);
      expect(instance.createdAt).toEqual(createdAtDate);
      expect(instance.title).toBe('Test Instance');
      expect(instance.items).toHaveLength(1);
    });
  });

  describe('completeItem', () => {
    const buildDocMock = (exists: boolean, items: object[]) => {
      const mockDoc = {
        exists,
        data: () => ({ items }),
      };
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet, update: mockUpdate };
      const mockDoc2 = jest.fn().mockReturnValue(mockDocRef);
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc2 });
      firestoreMock.collection = mockCollection;
      return { mockUpdate, mockGet, mockDocRef };
    };

    it('should throw NotFoundException when instance does not exist', async () => {
      buildDocMock(false, []);

      await expect(
        repository.completeItem('non-existent', 'item-1', '2026-04-20T12:00:00.000Z'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item does not exist in instance', async () => {
      buildDocMock(true, [
        { id: 'other-item', title: 'Other', description: 'desc' },
      ]);

      await expect(
        repository.completeItem('instance-1', 'missing-item', '2026-04-20T12:00:00.000Z'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when item is already completed', async () => {
      buildDocMock(true, [
        {
          id: 'item-1',
          title: 'Item 1',
          completed: { completed_at: '2026-04-19T10:00:00.000Z' },
        },
      ]);

      await expect(
        repository.completeItem('instance-1', 'item-1', '2026-04-20T12:00:00.000Z'),
      ).rejects.toThrow(ConflictException);
    });

    it('should update the item with completed_at and return void', async () => {
      const { mockUpdate } = buildDocMock(true, [
        { id: 'item-1', title: 'Item 1', description: 'desc' },
        { id: 'item-2', title: 'Item 2', description: 'desc2' },
      ]);

      const result = await repository.completeItem(
        'instance-1',
        'item-1',
        '2026-04-20T12:00:00.000Z',
      );

      expect(result).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        items: [
          {
            id: 'item-1',
            title: 'Item 1',
            description: 'desc',
            completed: { completed_at: '2026-04-20T12:00:00.000Z' },
          },
          { id: 'item-2', title: 'Item 2', description: 'desc2' },
        ],
      });
    });

    it('should include note in completed when provided', async () => {
      const { mockUpdate } = buildDocMock(true, [
        { id: 'item-1', title: 'Item 1', description: 'desc' },
      ]);

      await repository.completeItem(
        'instance-1',
        'item-1',
        '2026-04-20T12:00:00.000Z',
        'Great work',
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        items: [
          {
            id: 'item-1',
            title: 'Item 1',
            description: 'desc',
            completed: { completed_at: '2026-04-20T12:00:00.000Z', note: 'Great work' },
          },
        ],
      });
    });
  });

  describe('markItemIncomplete', () => {
    const buildDocMock = (exists: boolean, items: object[]) => {
      const mockDoc = {
        exists,
        data: () => ({ items }),
      };
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet, update: mockUpdate };
      const mockDoc2 = jest.fn().mockReturnValue(mockDocRef);
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc2 });
      firestoreMock.collection = mockCollection;
      return { mockUpdate, mockGet, mockDocRef };
    };

    it('should throw NotFoundException when instance does not exist', async () => {
      buildDocMock(false, []);

      await expect(
        repository.markItemIncomplete('non-existent', 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item does not exist in instance', async () => {
      buildDocMock(true, [
        { id: 'other-item', title: 'Other', description: 'desc' },
      ]);

      await expect(
        repository.markItemIncomplete('instance-1', 'missing-item'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when item is not completed', async () => {
      buildDocMock(true, [
        { id: 'item-1', title: 'Item 1', description: 'desc' },
      ]);

      await expect(
        repository.markItemIncomplete('instance-1', 'item-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should remove completed status from item and update', async () => {
      const { mockUpdate } = buildDocMock(true, [
        {
          id: 'item-1',
          title: 'Item 1',
          description: 'desc',
          completed: { completed_at: '2026-04-19T10:00:00.000Z' },
        },
        { id: 'item-2', title: 'Item 2', description: 'desc2' },
      ]);

      const result = await repository.markItemIncomplete('instance-1', 'item-1');

      expect(result).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        items: [
          { id: 'item-1', title: 'Item 1', description: 'desc' },
          { id: 'item-2', title: 'Item 2', description: 'desc2' },
        ],
      });
    });
  });
});
