import { Inject, Injectable } from '@nestjs/common';
import { CreateSystemNotificationDto } from './dto/system-notification.dto';
import { SystemNotificationRepositoryInterface } from 'src/database/interface/systemNotification.interface';
import { NotificationRepositoryInterface } from 'src/database/interface/notification.interface';
import { UserManagementService } from '../user-management/user-management.service';
import { NotificationService } from 'src/modules/users/notification/notification.service';

@Injectable()
export class NotiManagementService {
  constructor(
    @Inject('SystemNotificationRepositoryInterface')
    private readonly systemNotificationRepository: SystemNotificationRepositoryInterface,
    @Inject('NotificationRepositoryInterface')
    private readonly notificationRepository: NotificationRepositoryInterface,
    private readonly userManagementService: UserManagementService, // Assuming you have a UserManagementService to handle user-related operations
    private readonly notificationService: NotificationService,
  ) {}

  async createSystemNotification(dto: CreateSystemNotificationDto) {
    const systemNotification = await this.systemNotificationRepository.create({
      title: dto.title,
      type: dto.type,
      message: dto.message,
      recipients: dto.recipients,
      redirectUrl: dto.redirectUrl,
    });

    const userRepo = this.userManagementService.getRepository();

    const users = await userRepo.getModel().find({
      _id: { $in: dto.recipients },
    });

    if (users.length > 0) {
      const createNotiPromises = users.map((user) => {
        return this.notificationService.create(user._id.toString(), {
          title: systemNotification.title,
          message: systemNotification.message,
          type: systemNotification.type,
          redirectUrl: systemNotification.redirectUrl,
        });
      });
      Promise.allSettled(createNotiPromises);
    }

    return true;
  }
}
