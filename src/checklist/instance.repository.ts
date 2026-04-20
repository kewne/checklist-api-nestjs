import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { Item } from './checklist.repository';

export interface ChecklistInstanceDocument {
  id: string;
  checklistId: string;
  createdBy: string;
  createdAt: Date;
  title: string;
  items: Item[];
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
      items,
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

  async findCreatedBy(userId: string): Promise<ChecklistInstanceDocument[]> {
    const snapshot = await this.firestore
      .collection(this.collection)
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChecklistInstanceDocument,
    );
  }

  async delete(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
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

    const data = doc.data() as { items: Item[] };
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

    const data = doc.data() as { items: Item[] };
    const item = data.items.find((item) => item.id === itemId);

    if (item === undefined) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    if (!item.completed) {
      throw new ConflictException(`Item with id ${itemId} is not completed`);
    }

    item.completed = undefined;

    await docRef.update({ items: data.items });
  }
}
