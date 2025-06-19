import { Test, TestingModule } from '@nestjs/testing';
import { PostManagementService } from './post-management.service';

describe('PostManagementService', () => {
  let service: PostManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostManagementService],
    }).compile();

    service = module.get<PostManagementService>(PostManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
