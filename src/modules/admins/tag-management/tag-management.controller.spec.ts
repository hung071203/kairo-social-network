import { Test, TestingModule } from '@nestjs/testing';
import { TagManagementController } from './tag-management.controller';
import { TagManagementService } from './tag-management.service';

describe('TagManagementController', () => {
  let controller: TagManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagManagementController],
      providers: [TagManagementService],
    }).compile();

    controller = module.get<TagManagementController>(TagManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
