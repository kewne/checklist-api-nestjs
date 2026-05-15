import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

export interface InvitationDocument {
  id: string;
  checklistId: string;
  title: string;
  createdAt: Date;
}

@Injectable()
export class InvitationRepository {
  private readonly checklistsCollection = 'checklists';
  private readonly invitationsSubcollection = 'invitations';

  constructor(private readonly firestore: Firestore) {}

  async create(checklistId: string, title: string): Promise<string> {
    const data = {
      title,
      createdAt: new Date(),
    };

    const docRef = await this.firestore
      .collection(this.checklistsCollection)
      .doc(checklistId)
      .collection(this.invitationsSubcollection)
      .add(data);

    return docRef.id;
  }
}
