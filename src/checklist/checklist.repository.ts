import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { CreateChecklistDto } from './dto/create-checklist.dto';

export interface ChecklistDocument {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChecklistRepository {
  private readonly collection = 'checklists';

  constructor(private readonly firestore: Firestore) {}

  async create(
    createChecklistDto: CreateChecklistDto,
  ): Promise<ChecklistDocument> {
    const now = new Date();
    const checklistData = {
      title: createChecklistDto.title,
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

  async update(
    id: string,
    updateData: Partial<Omit<ChecklistDocument, 'id' | 'createdAt'>>,
  ): Promise<ChecklistDocument | null> {
    const docRef = this.firestore.collection(this.collection).doc(id);

    const updateWithTimestamp = {
      ...updateData,
      updatedAt: new Date(),
    };

    await docRef.update(updateWithTimestamp);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
  }
}
