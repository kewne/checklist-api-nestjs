import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';

export interface InvitationDocument {
  id: string;
  checklistId: string;
  title: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class InvitationRepository {
  private readonly checklistsCollection = 'checklists';
  private readonly invitationsSubcollection = 'invitations';

  constructor(private readonly firestore: Firestore) {}

  async create(
    checklistId: string,
    title: string,
    expiresAt: Date = new Date(Date.now() + 24 * 60 * 60 * 1000),
  ): Promise<string> {
    const data = {
      title,
      createdAt: new Date(),
      expiresAt,
    };

    const docRef = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.invitationsSubcollection)
      .add(data);

    return docRef.id;
  }

  async findById(
    checklistId: string,
    invitationId: string,
  ): Promise<InvitationDocument | null> {
    const snap = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.invitationsSubcollection)
      .doc(invitationId)
      .get();

    if (!snap.exists) {
      return null;
    }

    const data = snap.data()!;
    return {
      id: snap.id,
      checklistId,
      title: data.title as string,
      createdAt: (data.createdAt as Timestamp).toDate(),
      expiresAt: (data.expiresAt as Timestamp).toDate(),
    };
  }

  async delete(checklistId: string, invitationId: string): Promise<void> {
    await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.invitationsSubcollection)
      .doc(invitationId)
      .delete();
  }
}
