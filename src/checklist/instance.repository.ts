import { Firestore } from '@google-cloud/firestore';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Item, ItemCompleted } from './checklist.repository';
import { CreateInstanceItemFromDataDto } from './dto/create-checklist-instance-from-data.dto';
import { ReplaceChecklistInstanceDto } from './dto/replace-checklist-instance.dto';

export interface InstanceItem extends Item {
  completed: ItemCompleted | null;
}

export interface ChecklistInstanceDocument {
  id: string;
  checklistId: string | null;
  createdBy: string;
  createdAt: Date;
  title: string;
  items: InstanceItem[];
}

export interface ChecklistListItem {
  id: string;
  title: string;
}

@Injectable()
export class InstanceRepository {
  private readonly collection = 'checklistInstances';

  constructor(private readonly firestore: Firestore) {}

  async create(
    checklistId: string,
    userId: string,
    title: string,
    items: Item[],
  ): Promise<ChecklistInstanceDocument> {
    const now = new Date();
    const instanceData = {
      checklistId,
      createdBy: userId,
      createdAt: now,
      title,
      items: items.map((item) => ({ completed: null, ...item })),
    };

    const docRef = await this.firestore
      .collection(this.collection)
      .add(instanceData);

    return {
      id: docRef.id,
      ...instanceData,
    };
  }

  async createFromData(
    userId: string,
    title: string,
    items: CreateInstanceItemFromDataDto[],
  ): Promise<ChecklistInstanceDocument> {
    const now = new Date();
    const instanceData = {
      checklistId: null,
      createdBy: userId,
      createdAt: now,
      title,
      items: items.map((item) => ({
        id: randomUUID(),
        title: item.title,
        ...(item.description !== undefined && {
          description: item.description,
        }),
        completed: null,
      })),
    };

    const docRef = await this.firestore
      .collection(this.collection)
      .add(instanceData);

    return {
      id: docRef.id,
      ...instanceData,
    };
  }

  async findById(id: string): Promise<ChecklistInstanceDocument | null> {
    const doc = await this.firestore.collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as ChecklistInstanceDocument;
  }

  async findByChecklistId(
    checklistId: string,
  ): Promise<ChecklistInstanceDocument[]> {
    const snapshot = await this.firestore
      .collection(this.collection)
      .where('checklistId', '==', checklistId)
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChecklistInstanceDocument,
    );
  }

  async findCreatedBy(userId: string): Promise<ChecklistListItem[]> {
    const snapshot = await this.firestore
      .collection(this.collection)
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.get('title') as string,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
  }

  async replace(
    id: string,
    dto: ReplaceChecklistInstanceDto,
  ): Promise<ChecklistInstanceDocument | null> {
    const docRef = this.firestore.collection(this.collection).doc(id);

    return await this.firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        return null;
      }

      const existing = doc.data() as Omit<ChecklistInstanceDocument, 'id'>;

      const items: InstanceItem[] = dto.items.map((itemDto) => {
        const itemId = itemDto.id ?? randomUUID();
        const existingItem = existing.items.find((i) => i.id === itemId);
        return {
          id: itemId,
          title: itemDto.title,
          completed: existingItem?.completed ?? null,
        };
      });

      const newData = {
        title: dto.title,
        items,
      };

      transaction.update(docRef, newData);

      return {
        id,
        checklistId: existing.checklistId,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        ...newData,
      };
    });
  }

  async completeItem(
    instanceId: string,
    itemId: string,
    completedAt: string,
    note?: string | null,
  ): Promise<void> {
    const docRef = this.firestore.collection(this.collection).doc(instanceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(
        `Checklist instance with id ${instanceId} not found`,
      );
    }

    const data = doc.data() as { items: InstanceItem[] };
    const item = data.items.find((item) => item.id === itemId);

    if (item === undefined) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    if (item.completed) {
      throw new ConflictException(
        `Item with id ${itemId} is already completed`,
      );
    }
    item.completed = {
      completed_at: completedAt,
      ...(note != null && { note }),
    };

    await docRef.update({ items: data.items });
  }

  async markItemIncomplete(instanceId: string, itemId: string): Promise<void> {
    const docRef = this.firestore.collection(this.collection).doc(instanceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(
        `Checklist instance with id ${instanceId} not found`,
      );
    }

    const data = doc.data() as { items: InstanceItem[] };
    const item = data.items.find((item) => item.id === itemId);

    if (item === undefined) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    if (!item.completed) {
      throw new ConflictException(`Item with id ${itemId} is not completed`);
    }

    item.completed = null;

    await docRef.update({ items: data.items });
  }
}
