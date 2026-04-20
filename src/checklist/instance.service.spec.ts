import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import {
  InstanceRepository,
  ChecklistInstanceDocument,
} from './instance.repository';
import { ChecklistService } from './checklist.service';

describe('InstanceService', () => {
  let service: InstanceService;
  let repositoryMock: {
    create: jest.Mock;
    findById: jest.Mock;
    findByChecklistId: jest.Mock;
    findCreatedBy: jest.Mock;
    delete: jest.Mock;
    completeItem: jest.Mock;
  };
  let checklistServiceMock: {
    create: jest.Mock;
    findAll: jest.Mock;
    findAllByUser: jest.Mock;
    findOne: jest.Mock;
    replace: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repositoryMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findByChecklistId: jest.fn(),
      findCreatedBy: jest.fn(),
      delete: jest.fn(),
      completeItem: jest.fn(),
    };

    checklistServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      replace: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstanceService,
        {
          provide: InstanceRepository,
          useValue: repositoryMock,
        },
        {
          provide: ChecklistService,
          useValue: checklistServiceMock,
        },
      ],
    }).compile();

    service = module.get<InstanceService>(InstanceService);
  });

  describe('findCreatedBy', () => {
    it('should call repository with correct userId and return instances', async () => {
      // Arrange
      const userId = 'test-user-id';
      const instances: ChecklistInstanceDocument[] = [
        {
          id: 'instance-1',
          checklistId: 'checklist-1',
          createdBy: userId,
          createdAt: new Date('2026-01-01T10:00:00Z'),
          title: 'First Instance',
          items: [],
        },
        {
          id: 'instance-2',
          checklistId: 'checklist-2',
          createdBy: userId,
          createdAt: new Date('2026-03-15T14:30:00Z'),
          title: 'Second Instance',
          items: [],
        },
      ];
      repositoryMock.findCreatedBy.mockResolvedValue(instances);

      // Act
      const result = await service.findCreatedBy(userId);

      // Assert
      expect(repositoryMock.findCreatedBy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(instances);
      expect(result).toHaveLength(2);
      expect(result[0].createdAt.getTime()).toBeLessThan(
        result[1].createdAt.getTime(),
      );
    });

    it('should return empty array when user has no instances', async () => {
      // Arrange
      const userId = 'test-user-id';
      repositoryMock.findCreatedBy.mockResolvedValue([]);

      // Act
      const result = await service.findCreatedBy(userId);

      // Assert
      expect(repositoryMock.findCreatedBy).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should return instances sorted by creation date in ascending order', async () => {
      // Arrange
      const userId = 'test-user-id';
      const instances: ChecklistInstanceDocument[] = [
        {
          id: 'instance-1',
          checklistId: 'checklist-1',
          createdBy: userId,
          createdAt: new Date('2026-01-01T10:00:00Z'),
          title: 'Oldest',
          items: [],
        },
        {
          id: 'instance-2',
          checklistId: 'checklist-2',
          createdBy: userId,
          createdAt: new Date('2026-02-15T09:00:00Z'),
          title: 'Middle',
          items: [],
        },
        {
          id: 'instance-3',
          checklistId: 'checklist-3',
          createdBy: userId,
          createdAt: new Date('2026-03-20T15:00:00Z'),
          title: 'Newest',
          items: [],
        },
      ];
      repositoryMock.findCreatedBy.mockResolvedValue(instances);

      // Act
      const result = await service.findCreatedBy(userId);

      // Assert
      expect(result[0].title).toBe('Oldest');
      expect(result[1].title).toBe('Middle');
      expect(result[2].title).toBe('Newest');
    });
  });

  describe('findOne', () => {
    it('should return instance when found', async () => {
      // Arrange
      const instanceId = 'instance-123';
      const instance: ChecklistInstanceDocument = {
        id: instanceId,
        checklistId: 'checklist-456',
        createdBy: 'user-789',
        createdAt: new Date('2026-02-10T12:00:00Z'),
        title: 'Test Instance',
        items: [{ id: 'item-1', title: 'Item 1', description: 'Desc' }],
      };
      repositoryMock.findById.mockResolvedValue(instance);

      // Act
      const result = await service.findOne(instanceId);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(instanceId);
      expect(result).toEqual(instance);
      expect(result.id).toBe(instanceId);
      expect(result.title).toBe('Test Instance');
    });

    it('should throw NotFoundException when instance not found', async () => {
      // Arrange
      const instanceId = 'non-existent-id';
      repositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(instanceId)).rejects.toThrow(
        NotFoundException as unknown as string,
      );
      expect(repositoryMock.findById).toHaveBeenCalledWith(instanceId);
    });
  });

  describe('completeItem', () => {
    it('should call repository with instanceId, itemId, ISO timestamp, and note', async () => {
      repositoryMock.completeItem.mockResolvedValue(undefined);

      await service.completeItem('instance-1', 'item-1', 'Good job');

      expect(repositoryMock.completeItem).toHaveBeenCalledWith(
        'instance-1',
        'item-1',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        'Good job',
      );
    });

    it('should call repository without note when not provided', async () => {
      repositoryMock.completeItem.mockResolvedValue(undefined);

      await service.completeItem('instance-1', 'item-1');

      expect(repositoryMock.completeItem).toHaveBeenCalledWith(
        'instance-1',
        'item-1',
        expect.any(String),
        undefined,
      );
    });

    it('should propagate NotFoundException from repository', async () => {
      repositoryMock.completeItem.mockRejectedValue(
        new NotFoundException('instance not found'),
      );

      await expect(
        service.completeItem('non-existent', 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException from repository', async () => {
      repositoryMock.completeItem.mockRejectedValue(
        new ConflictException('already completed'),
      );

      await expect(
        service.completeItem('instance-1', 'item-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
