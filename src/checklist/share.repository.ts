import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

export interface ShareDocument {
  id: string;
  checklistId: string;
  userId: string;
  createdAt: Date;
}

@Injectable()
export class ShareRepository {
  private readonly checklistsCollection = 'checklists';
  private readonly sharesSubcollection = 'shares';

  constructor(private readonly firestore: Firestore) {}

  async create(checklistId: string, userId: string): Promise<string> {
    const now = new Date();
    const data = {
      userId,
      createdAt: now,
    };

    const docRef = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.sharesSubcollection)
      .add(data);

    return docRef.id;
  }

  async findByChecklist(checklistId: string): Promise<ShareDocument[]> {
    const snapshot = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.sharesSubcollection)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          checklistId,
          ...doc.data(),
        }) as ShareDocument,
    );
  }

  async findByUserId(userId: string): Promise<ShareDocument[]> {
    // Note: Querying across subcollections requires a collection group query
    const snapshot = await this.firestore
      .collectionGroup(this.sharesSubcollection)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const checklistId = doc.ref.parent.parent?.id;
      return {
        id: doc.id,
        checklistId: checklistId ?? '',
        ...doc.data(),
      } as ShareDocument;
    });
  }

  async existsByChecklistAndUser(
    checklistId: string,
    userId: string,
  ): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.sharesSubcollection)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  async delete(checklistId: string, shareId: string): Promise<void> {
    await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.sharesSubcollection)
      .doc(shareId)
      .delete();
  }
}
