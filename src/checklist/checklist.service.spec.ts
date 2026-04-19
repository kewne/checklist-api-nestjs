import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistService } from './checklist.service';
import { ChecklistRepository, ChecklistDocument } from './checklist.repository';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';
import { NotFoundException } from '@nestjs/common';

describe('ChecklistService', () => {
  let service: ChecklistService;
  let repository: {
    create: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
    findCreatedBy: jest.Mock;
    delete: jest.Mock;
    replace: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findCreatedBy: jest.fn(),
      delete: jest.fn(),
      replace: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        {
          provide: ChecklistRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a checklist without items', async () => {
      // Arrange
      const dto: CreateChecklistDto = { title: 'Test Checklist' };
      const userId = 'user-123';
      const createdChecklist: ChecklistDocument = {
        id: 'checklist-1',
        title: 'Test Checklist',
        items: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockResolvedValue(createdChecklist);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(createdChecklist);
    });

    it('should create a checklist with items', async () => {
      // Arrange
      const dto: CreateChecklistDto = {
        title: 'Test Checklist',
        items: [
          { title: 'Item 1', description: 'Description 1' },
          { title: 'Item 2', description: 'Description 2' },
        ],
      };
      const userId = 'user-123';
      const createdChecklist: ChecklistDocument = {
        id: 'checklist-1',
        title: 'Test Checklist',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { id: 'item-2', title: 'Item 2', description: 'Description 2' },
        ],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockResolvedValue(createdChecklist);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(createdChecklist);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should retrieve a checklist by id', async () => {
      // Arrange
      const checklist: ChecklistDocument = {
        id: 'checklist-1',
        title: 'Test Checklist',
        items: [{ id: 'item-1', title: 'Item 1', description: 'Description 1' }],
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(checklist);

      // Act
      const result = await service.findOne('checklist-1');

      // Assert
      expect(repository.findById).toHaveBeenCalledWith('checklist-1');
      expect(result).toEqual(checklist);
    });
  });

  describe('replace', () => {
    it('should return the updated checklist when found', async () => {
      // Arrange
      const dto: ReplaceChecklistDto = {
        title: 'Updated Title',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { title: 'Item 2', description: 'Description 2' },
        ],
      };
      const updatedChecklist: ChecklistDocument = {
        id: 'checklist-1',
        title: 'Updated Title',
        items: [
          { id: 'item-1', title: 'Item 1', description: 'Description 1' },
          { id: 'item-2', title: 'Item 2', description: 'Description 2' },
        ],
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.replace.mockResolvedValue(updatedChecklist);

      // Act
      const result = await service.replace('checklist-1', dto);

      // Assert
      expect(repository.replace).toHaveBeenCalledWith('checklist-1', dto);
      expect(result).toEqual(updatedChecklist);
    });

    it('should throw NotFoundException when checklist does not exist', async () => {
      // Arrange
      const dto: ReplaceChecklistDto = { title: 'Updated Title' };
      repository.replace.mockResolvedValue(null);

      // Act & Assert
      await expect(service.replace('nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
