import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { FirestoreModule } from '../../firestore.module';
import { ChecklistRepository } from '../checklist.repository';
import { ChecklistService } from '../checklist.service';
import {
  ChecklistInstanceDocument,
  InstanceRepository,
} from './instance.repository';
import { InstanceService } from './instance.service';

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

  describe('createFromData', () => {
    it('should create an instance with items and descriptions from the given data', async () => {
      const userId = randomUUID();

      const instanceId = await service.createFromData(userId, {
        title: 'My Instance',
        items: [
          { title: 'Step 1', description: 'Do step 1' },
          { title: 'Step 2' },
        ],
      });

      expect(
        await service.findOne(instanceId),
      ).toEqual<ChecklistInstanceDocument>({
        id: instanceId,
        createdAt: expect.anything() as Date,
        checklistId: null,
        createdBy: userId,
        title: 'My Instance',
        items: [
          {
            id: expect.any(String) as string,
            title: 'Step 1',
            description: 'Do step 1',
            completed: null,
          },
          {
            id: expect.any(String) as string,
            title: 'Step 2',
            completed: null,
          },
        ],
      });
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

      const instanceId = await service.createInstance(checklist.id, userId);
      const instance = await service.findOne(instanceId);

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

      const items = await Promise.all(
        ['Oldest', 'Middle', 'West'].map(async (name) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          const id = await instanceRepository.create(
            checklist.id,
            userId,
            name,
            [],
          );
          return { id, title: name };
        }),
      );

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
      const id = await instanceRepository.create(
        checklist.id,
        userId,
        'My Instance',
        checklist.items,
      );

      const result = await service.findOne(id);

      expect(result.id).toBe(id);
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
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );
      const instance = await service.findOne(instanceId);
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
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );
      const instance = await instanceRepository.findById(instanceId);
      if (instance == null) {
        throw new Error('Failed to fetch instance');
      }
      const itemId = instance.items[0].id;
      await service.completeItem(instanceId, itemId);
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
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );

      const instance = await instanceRepository.findById(instanceId);
      await expect(
        service.markItemIncomplete(instanceId, instance!.items[0].id),
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
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Original Title',
        checklist.items,
      );
      const {
        items: [item1, item2],
      } = (await instanceRepository.findById(instanceId))!;
      await service.completeItem(instanceId, item1.id, 'done');

      await service.replace(instanceId, {
        title: 'New Title',
        items: [
          { name: item1.id, title: 'Renamed Task 1' },
          { name: item2.id, title: 'Renamed Task 2' },
        ],
      });

      expect(await instanceRepository.findById(instanceId)).toEqual({
        id: instanceId,
        checklistId: checklist.id,
        createdBy: userId,
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
      const id = await instanceRepository.create(
        checklist.id,
        userId,
        'Original Title',
        checklist.items,
      );

      await service.replace(id, {
        title: 'New Title',
        items: [{ title: 'Brand New Item' }],
      });

      expect(await service.findOne(id)).toEqual<ChecklistInstanceDocument>({
        id: id,
        checklistId: checklist.id,
        createdBy: userId,
        createdAt: expect.anything() as Date,
        title: 'New Title',
        items: [
          {
            id: expect.any(String) as string,
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

  describe('addItem', () => {
    it('should add an item with title and description', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        {
          title: 'CL',
          items: [{ title: 'Initial Item', description: 'Initial' }],
        },
        userId,
      );
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        checklist.items,
      );

      const result = await service.addItem(instanceId, {
        title: 'New Item',
        description: 'New Description',
      });

      expect(result.items).toHaveLength(2);
      const newItem = result.items[1];
      expect(newItem.title).toBe('New Item');
      expect(newItem.description).toBe('New Description');
      expect(newItem.completed).toBeNull();
    });

    it('should add an item with title only', async () => {
      const userId = randomUUID();
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [] },
        userId,
      );
      const instanceId = await instanceRepository.create(
        checklist.id,
        userId,
        'Test Instance',
        [],
      );

      const result = await service.addItem(instanceId, {
        title: 'New Item',
      });

      expect(result.items).toHaveLength(1);
      const newItem = result.items[0];
      expect(newItem.title).toBe('New Item');
      expect(newItem.description).toBeUndefined();
      expect(newItem.completed).toBeNull();
    });

    it('should throw NotFoundException for unknown instance', async () => {
      await expect(
        service.addItem('non-existent-id', { title: 'New Item' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
