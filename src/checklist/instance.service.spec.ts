import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
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

  describe('createInstance', () => {
    it('should create an instance with items from the checklist', async () => {
      const checklist = await checklistRepository.create(
        {
          title: 'My Checklist',
          items: [{ title: 'Step 1', description: 'Do step 1' }],
        },
        'user-1',
      );

      const instance = await service.createInstance(checklist.id, 'user-1');

      expect(instance.checklistId).toBe(checklist.id);
      expect(instance.createdBy).toBe('user-1');
      expect(instance.items).toHaveLength(1);
      expect(instance.items[0].title).toBe('Step 1');
      expect(instance.items[0].completed).toBeNull();
    });

    it('should throw NotFoundException for unknown checklist', async () => {
      await expect(
        service.createInstance('non-existent-checklist', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCreatedBy', () => {
    it('should return instances sorted by createdAt ascending', async () => {
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [] },
        'user-1',
      );

      const items = await Promise.all([
        instanceRepository.create(checklist.id, 'user-1', 'Oldest', []),
        instanceRepository.create(checklist.id, 'user-1', 'Middle', []),
        instanceRepository.create(checklist.id, 'user-1', 'Newest', []),
      ]);

      const result = await service.findCreatedBy('user-1');

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
      const checklist = await checklistRepository.create(
        {
          title: 'CL',
          items: [{ title: 'Item A', description: 'Item A description' }],
        },
        'user-1',
      );
      const created = await instanceRepository.create(
        checklist.id,
        'user-1',
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
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do it' }] },
        'user-1',
      );
      const instance = await instanceRepository.create(
        checklist.id,
        'user-1',
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
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do task 1' }] },
        'user-1',
      );
      const instance = await instanceRepository.create(
        checklist.id,
        'user-1',
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
      const checklist = await checklistRepository.create(
        { title: 'CL', items: [{ title: 'Task 1', description: 'Do task 1' }] },
        'user-1',
      );
      const instance = await instanceRepository.create(
        checklist.id,
        'user-1',
        'Test Instance',
        checklist.items,
      );

      await expect(
        service.markItemIncomplete(instance.id, instance.items[0].id),
      ).rejects.toThrow(ConflictException);
    });
  });
});
