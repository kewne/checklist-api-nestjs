import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { FirestoreModule } from '../firestore.module';
import { ChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';
import { InstanceRepository } from './instance.repository';
import { InstanceService } from './instance.service';

const EMULATOR_BASE =
  'http://127.0.0.1:8080/emulator/v1/projects/demo-test/databases/(default)/documents';

describe('InstanceService', () => {
  let service: InstanceService;
  let instanceRepository: InstanceRepository;
  let checklistRepository: ChecklistRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), FirestoreModule],
      providers: [
        ChecklistRepository,
        ChecklistService,
        InstanceRepository,
        InstanceService,
      ],
    }).compile();

    service = module.get<InstanceService>(InstanceService);
    instanceRepository = module.get<InstanceRepository>(InstanceRepository);
    checklistRepository = module.get<ChecklistRepository>(ChecklistRepository);
  });

  afterEach(async () => {
    await fetch(EMULATOR_BASE, { method: 'DELETE' });
  });

  describe('createFromData', () => {
    it('should create an instance with items and descriptions from the given data', async () => {
      const userId = randomUUID();

      const instance = await service.createFromData(userId, {
        title: 'My Instance',
        items: [
          { title: 'Step 1', description: 'Do step 1' },
          { title: 'Step 2' },
        ],
      });

      expect(instance.checklistId).toBeNull();
      expect(instance.createdBy).toBe(userId);
      expect(instance.title).toBe('My Instance');
      expect(instance.items).toHaveLength(2);
      expect(instance.items[0].title).toBe('Step 1');
      expect(instance.items[0].description).toBe('Do step 1');
      expect(instance.items[0].completed).toBeNull();
      expect(instance.items[1].title).toBe('Step 2');
      expect(instance.items[1].description).toBeUndefined();
      expect(instance.items[1].completed).toBeNull();
    });
  });

  describe('createInstance', () => {
    it('should create an instance with items from the checklist', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        {
          title: 'My Checklist',
          items: [{ title: 'Step 1', description: 'Do step 1' }],
        },
        userId,
      );

      const instance = await service.createInstance(checklist.id, userId);

      expect(instance.checklistId).toBe(checklist.id);
      expect(instance.createdBy).toBe(userId);
      expect(instance.items).toHaveLength(1);
      expect(instance.items[0].title).toBe('Step 1');
      expect(instance.items[0].completed).toBeNull();
    });

    it('should throw NotFoundException for unknown checklist', async () => {
      await expect(
        service.createInstance('non-existent-checklist', randomUUID()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCreatedBy', () => {
    it('should return instances sorted by createdAt ascending', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [] },
        userId,
      );

      const items = [
        await instanceRepository.create(checklist.id, userId, 'Oldest', []),
        await instanceRepository.create(checklist.id, userId, 'Middle', []),
        await instanceRepository.create(checklist.id, userId, 'Newest', []),
      ];

      const result = await service.findCreatedBy(userId);

      expect(result).toEqual(
        items.map((item) => ({
          id: item.id,
          title: item.title,
        })),
      );
    });

    it('should return empty array when user has no instances', async () => {
      const result = await service.findCreatedBy('user-with-no-instances');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the instance when found', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        {
          title: 'CL',
          items: [{ title: 'Item A', description: 'Item A description' }],
        },
        userId,
      );
      const created = await instanceRepository.create(
        checklist.id,
        userId,
        'My Instance',
        checklist.items,
      );

      const result = await service.findOne(created.id);

      expect(result.id).toBe(created.id);
      expect(result.title).toBe('My Instance');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when instance does not exist', async () => {
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeItem', () => {
    async function seedInstanceWithItem() {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do it' }] },
        userId,
      );
      const instance = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );
      return { instance, itemId: instance.items[0].id };
    }

    it('should mark item as completed with a note', async () => {
      const { instance, itemId } = await seedInstanceWithItem();

      await service.completeItem(instance.id, itemId, 'Great job');

      const updated = await service.findOne(instance.id);
      const item = updated.items.find((i) => i.id === itemId)!;
      expect(item.completed).not.toBeNull();
      expect(item.completed!.completed_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(item.completed!.note).toBe('Great job');
    });

    it('should mark item as completed without a note', async () => {
      const { instance, itemId } = await seedInstanceWithItem();

      await service.completeItem(instance.id, itemId);

      const updated = await service.findOne(instance.id);
      const item = updated.items.find((i) => i.id === itemId)!;
      expect(item.completed).not.toBeNull();
      expect(item.completed).not.toHaveProperty('note');
    });

    it('should throw NotFoundException for unknown instance', async () => {
      await expect(
        service.completeItem('non-existent-instance', 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when item is already completed', async () => {
      const { instance, itemId } = await seedInstanceWithItem();
      await service.completeItem(instance.id, itemId);

      await expect(service.completeItem(instance.id, itemId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('markItemIncomplete', () => {
    async function seedCompletedItem() {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do task 1' }] },
        userId,
      );
      const instance = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );
      const itemId = instance.items[0].id;
      await service.completeItem(instance.id, itemId);
      return { instance, itemId };
    }

    it('should mark a completed item as incomplete', async () => {
      const { instance, itemId } = await seedCompletedItem();

      await service.markItemIncomplete(instance.id, itemId);

      const updated = await service.findOne(instance.id);
      const item = updated.items.find((i) => i.id === itemId)!;
      expect(item.completed).toBeNull();
    });

    it('should throw NotFoundException for unknown instance', async () => {
      await expect(
        service.markItemIncomplete('non-existent-instance', 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when item is not completed', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do task 1' }] },
        userId,
      );
      const instance = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );

      await expect(
        service.markItemIncomplete(instance.id, instance.items[0].id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('replace', () => {
    it('should replace title and items while preserving completion status for matched items', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        {
          title: 'CL',
          items: [
            { title: 'Task 1', description: 'Do task 1' },
            { title: 'Task 2', description: 'Do task 2' },
          ],
        },
        userId,
      );
      const original = await instanceRepository.create(
        checklist.id,
        userId,
        'Original Title',
        checklist.items,
      );
      const [item1, item2] = original.items;
      await service.completeItem(original.id, item1.id, 'done');

      const result = await service.replace(original.id, {
        title: 'New Title',
        items: [
          { id: item1.id, title: 'Renamed Task 1' },
          { id: item2.id, title: 'Renamed Task 2' },
        ],
      });

      expect(result).toEqual({
        id: original.id,
        checklistId: original.checklistId,
        createdBy: original.createdBy,
        createdAt: expect.any(Object) as string,
        title: 'New Title',
        items: [
          {
            id: item1.id,
            title: 'Renamed Task 1',
            completed: expect.objectContaining({
              completed_at: expect.any(String) as string,
            }) as object,
          },
          {
            id: item2.id,
            title: 'Renamed Task 2',
            completed: null,
          },
        ],
      });
    });

    it('should assign null completion to new items without an id', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do task 1' }] },
        userId,
      );
      const instance = await instanceRepository.create(
        checklist.id,
        userId,
        'Original Title',
        checklist.items,
      );

      const result = await service.replace(instance.id, {
        title: 'New Title',
        items: [{ title: 'Brand New Item' }],
      });

      expect(result).toEqual({
        id: instance.id,
        checklistId: instance.checklistId,
        createdBy: instance.createdBy,
        createdAt: expect.any(Object),
        title: 'New Title',
        items: [
          {
            id: expect.any(String),
            title: 'Brand New Item',
            completed: null,
          },
        ],
      });
    });

    it('should throw NotFoundException for unknown instance', async () => {
      await expect(
        service.replace('non-existent-id', { title: 'Title', items: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
