import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';

export interface ChecklistInstanceDocument {
  id: string;
  checklistId: string;
  createdAt: Date;
  name?: string;
}

@Injectable()
export class InstanceRepository {
  private readonly collection = 'checklistInstances';

  constructor(private readonly firestore: Firestore) {}

  async create(
    checklistId: string,
    createInstanceDto: CreateChecklistInstanceDto,
  ): Promise<ChecklistInstanceDocument> {
    const now = new Date();
    const instanceData = {
      checklistId,
      createdAt: now,
      name: createInstanceDto.name,
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

  async delete(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
  }
}
