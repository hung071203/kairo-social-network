import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationDto } from 'src/common/decorators';
import { NotificationRepositoryInterface } from 'src/database/interface/notification.interface';
import { CreateNotiDto, FilterNotiDto } from './dto/noti.dto';
import { NotificationGateway } from 'src/gateways/notification/notification.gateway';
import { Notification } from 'src/schemas/notifications.schema';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NotificationRepositoryInterface')
    private readonly notificationRepository: NotificationRepositoryInterface,
    private readonly notiGateway: NotificationGateway
  ) {}

  async getNotifications(
    userId: string,
    dto: FilterNotiDto,
    pagination: PaginationDto,
  ) {
    
    return this.notificationRepository.findAll(
      {
        user: new Types.ObjectId(userId),
        ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
      },
      pagination,
    );
  }

  async getUnreadNotificationCount(userId: string) {
    const unread = await this.notificationRepository.count({
      user: new Types.ObjectId(userId),
      isRead: false,
    });

    const total = await this.notificationRepository.count({
      user: new Types.ObjectId(userId),
    });

    return {
      unread,
      total,
    };
  }

  async create(userId: string, dto: CreateNotiDto) {
    const form: any = {};

    form.type = dto.type;
    form.user = new Types.ObjectId(userId);
    form.title = dto.title;
    form.message = dto.message;
    form.isRead = false;
    form.redirectUrl = dto.redirectUrl;
    form.systemNotification = dto.systemNotification
      ? new Types.ObjectId(dto.systemNotification)
      : null;
    
    const noti = await this.notificationRepository.create(form);
    this.notiGateway.sendNotification(noti)
    return noti;
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationRepository.findOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new Error(
        'Thông báo không tồn tại hoặc không thuộc về người dùng này',
      );
    }

    return this.notificationRepository.update(notification._id as string, {
      isRead: true,
    });
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.getModel().updateMany(
      {
        user: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  }

  async deleteNotification(userId: string, id: string) {
    const notification = await this.notificationRepository.findOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new Error(
        'Thông báo không tồn tại hoặc không thuộc về người dùng này',
      );
    }

    return this.notificationRepository.delete(notification._id as string);
  }
}
