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

interface ChecklistInstanceItem {
  instance: { createdBy: string };
}

export type Actions = 'create' | 'read';
export type Subjects =
  | ChecklistShareInvitation
  | 'ChecklistShareInvitation'
  | ChecklistInstanceItem
  | 'ChecklistInstanceItem';

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

    can('create', 'ChecklistInstanceItem', {
      'instance.createdBy': user.uid,
    });

    return build();
  }
}
