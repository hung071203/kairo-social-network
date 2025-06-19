import { Test, TestingModule } from '@nestjs/testing';
import { PostManagementController } from './post-management.controller';
import { PostManagementService } from './post-management.service';

describe('PostManagementController', () => {
  let controller: PostManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostManagementController],
      providers: [PostManagementService],
    }).compile();

    controller = module.get<PostManagementController>(PostManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
