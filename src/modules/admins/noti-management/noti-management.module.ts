import { Module } from '@nestjs/common';
import { NotiManagementService } from './noti-management.service';
import { NotiManagementController } from './noti-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from 'src/schemas/notifications.schema';
import { SystemNotification, SystemNotificationSchema } from 'src/schemas/systemNotifications.schema';
import { NotificationRepository } from 'src/database/repository/notification.repository';
import { SystemNotificationRepository } from 'src/database/repository/systemNotification.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      {
        name: SystemNotification.name,
        schema: SystemNotificationSchema,
      }
    ]),
  ], // Add your schemas here if needed
  controllers: [NotiManagementController],
  providers: [NotiManagementService,
    {
      provide: 'NotificationRepositoryInterface',
      useClass: NotificationRepository
    },
    {
      provide: 'SystemNotificationRepositoryInterface',
      useClass: SystemNotificationRepository
    }
  ],
})
export class NotiManagementModule {}
