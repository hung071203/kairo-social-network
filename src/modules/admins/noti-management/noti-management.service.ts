import { Inject, Injectable } from '@nestjs/common';
import { CreateSystemNotificationDto } from './dto/system-notification.dto';
import { SystemNotificationRepositoryInterface } from 'src/database/interface/systemNotification.interface';
import { NotificationRepositoryInterface } from 'src/database/interface/notification.interface';
import { UserManagementService } from '../user-management/user-management.service';
import { NotificationService } from 'src/modules/users/notification/notification.service';
import { PaginationDto } from 'src/common/decorators';

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
          systemNotification: systemNotification._id.toString(),
        });
      });
      Promise.allSettled(createNotiPromises);
    }

    return true;
  }

  async getSystemNotifications(pagination: PaginationDto) {
    return this.systemNotificationRepository.findAll({}, pagination);
  }

  async deleteSystemNotification(id: string) {
    const systemNotification = await this.systemNotificationRepository.findOneById(id);
    if (!systemNotification) {
      throw new Error('Thông báo không tồn tại');
    }

    // Xoá tất cả thông báo liên quan đến thông báo hệ thống này
    await this.notificationRepository.getModel().deleteMany({
      systemNotification: systemNotification._id,
    });

    // Xoá thông báo hệ thống
    return this.systemNotificationRepository.delete(id);
  }
}
