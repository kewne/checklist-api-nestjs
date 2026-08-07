import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth.guard';

interface ChecklistShareInvitation {
  checklist: { createdBy: string };
}

interface ChecklistShare {
  checklist: { createdBy: string };
}

interface ChecklistShareEntry {
  id: string;
  checklistId: string;
  userId: string;
  title: string;
  createdAt: Date;
}

interface Checklist {
  createdBy: string;
  shares: ChecklistShareEntry[];
}

interface ChecklistInstanceItem {
  instance: { createdBy: string };
}

interface ChecklistsSharedWithUser {
  userId: string;
}

export type Actions = 'create' | 'read' | 'delete';
export type Subjects =
  | ChecklistShareInvitation
  | 'ChecklistShareInvitation'
  | ChecklistShare
  | 'ChecklistShare'
  | Checklist
  | 'Checklist'
  | ChecklistInstanceItem
  | 'ChecklistInstanceItem'
  | ChecklistsSharedWithUser
  | 'ChecklistsSharedWithUser';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    can('create', 'ChecklistShareInvitation', {
      'checklist.createdBy': user.uid,
    });

    can('read', 'ChecklistShareInvitation', {
      'checklist.createdBy': user.uid,
    });

    can('delete', 'ChecklistShareInvitation', {
      'checklist.createdBy': user.uid,
    });

    can('read', 'ChecklistShare', {
      'checklist.createdBy': user.uid,
    });

    can('delete', 'ChecklistShare', {
      'checklist.createdBy': user.uid,
    });

    can('read', 'Checklist', { createdBy: user.uid });
    can('read', 'Checklist', {
      shares: { $elemMatch: { userId: user.uid } },
    });

    can('create', 'ChecklistInstanceItem', {
      'instance.createdBy': user.uid,
    });

    can('read', 'ChecklistsSharedWithUser', { userId: user.uid });

    return build();
  }
}
