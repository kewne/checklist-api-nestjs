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
    it('should create an ability instance', () => {
      const ability = factory.createForUser();

      expect(ability).toBeDefined();
    });

    it('should return an Ability instance with no rules in minimal bootstrap', () => {
      const ability = factory.createForUser();

      // In minimal bootstrap, ability should have no rules
      expect(ability.rules).toEqual([]);
    });
  });
});
