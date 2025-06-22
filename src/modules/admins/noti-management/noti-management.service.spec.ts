import { Test, TestingModule } from '@nestjs/testing';
import { NotiManagementService } from './noti-management.service';

describe('NotiManagementService', () => {
  let service: NotiManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotiManagementService],
    }).compile();

    service = module.get<NotiManagementService>(NotiManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
