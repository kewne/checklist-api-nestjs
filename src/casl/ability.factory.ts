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

export type Actions = 'create';
export type Subjects = ChecklistShareInvitation | 'ChecklistShareInvitation';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    can('create', 'ChecklistShareInvitation', {
      'checklist.createdBy': user.uid,
    });

    return build();
  }
}
