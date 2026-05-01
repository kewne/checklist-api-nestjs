import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

export type Subjects = 'all';

export type AppAbility = MongoAbility<[string, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(): AppAbility {
    const { build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    return build();
  }
}
