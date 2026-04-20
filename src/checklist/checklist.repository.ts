import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { randomUUID } from 'crypto';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { ReplaceChecklistDto } from './dto/update-checklist.dto';

export interface ItemCompleted {
  completed_at: string;
  note?: string | null;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  completed?: ItemCompleted;
}

export interface ChecklistDocument {
  id: string;
  title: string;
  items: Item[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChecklistRepository {
  private readonly collection = 'checklists';

  constructor(private readonly firestore: Firestore) {}

  async create(
    createChecklistDto: CreateChecklistDto,
    createdByUserId: string,
  ): Promise<ChecklistDocument> {
    const now = new Date();

    const items = (createChecklistDto.items ?? []).map((itemDto) => ({
      ...itemDto,
      id: randomUUID(),
    }));

    const checklistData = {
      title: createChecklistDto.title,
      items,
      createdBy: createdByUserId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.firestore
      .collection(this.collection)
      .add(checklistData);

    return {
      id: docRef.id,
      ...checklistData,
    };
  }

  async findById(id: string): Promise<ChecklistDocument | null> {
    const doc = await this.firestore.collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as ChecklistDocument;
  }

  async findAll(): Promise<ChecklistDocument[]> {
    const snapshot = await this.firestore.collection(this.collection).get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChecklistDocument,
    );
  }

  async findCreatedBy(userId: string): Promise<ChecklistDocument[]> {
    const snapshot = await this.firestore
      .collection(this.collection)
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChecklistDocument,
    );
  }

  async delete(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
  }

  async replace(
    id: string,
    replaceChecklistDto: ReplaceChecklistDto,
  ): Promise<ChecklistDocument | null> {
    const docRef = this.firestore.collection(this.collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const items = (replaceChecklistDto.items ?? []).map((itemDto) => ({
      title: itemDto.title,
      ...(itemDto.description !== undefined && { description: itemDto.description }),
      id: itemDto.id ?? randomUUID(),
    }));

    const updatedAt = new Date();
    await docRef.update({ title: replaceChecklistDto.title, items, updatedAt });

    return {
      ...(doc.data() as Omit<ChecklistDocument, 'id' | 'title' | 'items' | 'updatedAt'>),
      id,
      title: replaceChecklistDto.title,
      items,
      updatedAt,
    };
  }
}
