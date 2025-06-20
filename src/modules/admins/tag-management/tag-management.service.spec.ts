import { Test, TestingModule } from '@nestjs/testing';
import { TagManagementService } from './tag-management.service';

describe('TagManagementService', () => {
  let service: TagManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagManagementService],
    }).compile();

    service = module.get<TagManagementService>(TagManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
