import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Notification } from 'src/schemas/notifications.schema';
import { NotificationRepositoryInterface } from '../interface/notification.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class NotificationRepository
  extends BaseRepository<Notification>
  implements NotificationRepositoryInterface
{
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationRepository: PaginateModel<Notification>,
  ) {
    super(notificationRepository);
  }
}
