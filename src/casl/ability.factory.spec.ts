import { subject } from '@casl/ability';
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from './ability.factory';

describe('AbilityFactory', () => {
  let factory: AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    factory = module.get<AbilityFactory>(AbilityFactory);
  });

  describe('createForUser', () => {
    const user = { uid: 'user-1' };

    it('should create an ability instance', () => {
      const ability = factory.createForUser(user);

      expect(ability).toBeDefined();
    });

    it('should allow owner to create a ChecklistShareInvitation', () => {
      const ability = factory.createForUser(user);

      expect(
        ability.can(
          'create',
          subject('ChecklistShareInvitation', {
            checklist: { createdBy: user.uid },
          }),
        ),
      ).toBe(true);
    });

    it('should not allow non-owner to create a ChecklistShareInvitation', () => {
      const ability = factory.createForUser(user);

      expect(
        ability.can(
          'create',
          subject('ChecklistShareInvitation', {
            checklist: { createdBy: 'other-user' },
          }),
        ),
      ).toBe(false);
    });

    it('should allow owner to create a ChecklistInstanceItem', () => {
      const ability = factory.createForUser(user);

      expect(
        ability.can(
          'create',
          subject('ChecklistInstanceItem', {
            instance: { createdBy: user.uid },
          }),
        ),
      ).toBe(true);
    });

    it('should not allow non-owner to create a ChecklistInstanceItem', () => {
      const ability = factory.createForUser(user);

      expect(
        ability.can(
          'create',
          subject('ChecklistInstanceItem', {
            instance: { createdBy: 'other-user' },
          }),
        ),
      ).toBe(false);
    });
  });
});
