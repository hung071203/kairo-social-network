import { Test, TestingModule } from '@nestjs/testing';
import { NotiManagementController } from './noti-management.controller';
import { NotiManagementService } from './noti-management.service';

describe('NotiManagementController', () => {
  let controller: NotiManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotiManagementController],
      providers: [NotiManagementService],
    }).compile();

    controller = module.get<NotiManagementController>(NotiManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
