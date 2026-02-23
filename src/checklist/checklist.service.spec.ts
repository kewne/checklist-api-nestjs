import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistService } from './checklist.service';
import { ChecklistRepository } from './checklist.repository';

describe('ChecklistService', () => {
  let service: ChecklistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        {
          provide: ChecklistRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
