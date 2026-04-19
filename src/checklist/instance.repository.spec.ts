import { Test, TestingModule } from '@nestjs/testing';
import { InstanceRepository } from './instance.repository';
import { Firestore } from '@google-cloud/firestore';

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
});
