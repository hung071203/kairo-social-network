import { Controller } from '@nestjs/common';
import { NotiManagementService } from './noti-management.service';

@Controller('noti-management')
export class NotiManagementController {
  constructor(private readonly notiManagementService: NotiManagementService) {}
}
