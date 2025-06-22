import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { SystemNotification } from 'src/schemas/systemNotifications.schema';
import { SystemNotificationRepositoryInterface } from '../interface/systemNotification.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SystemNotificationRepository
  extends BaseRepository<SystemNotification>
  implements SystemNotificationRepositoryInterface
{
  constructor(
    @InjectModel(SystemNotification.name)
    private readonly systemNotificationRepository: PaginateModel<SystemNotification>,
  ) {
    super(systemNotificationRepository);
  }
}
