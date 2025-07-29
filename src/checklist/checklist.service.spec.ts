import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistService } from './checklist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Checklist } from './entities/checklist.entity';

describe('ChecklistService', () => {
  let service: ChecklistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        {
          provide: getRepositoryToken(Checklist),
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
