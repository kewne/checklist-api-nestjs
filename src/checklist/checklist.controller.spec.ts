import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';

describe('ChecklistController', () => {
  let controller: ChecklistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [ChecklistService],
    }).compile();

    controller = module.get<ChecklistController>(ChecklistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
