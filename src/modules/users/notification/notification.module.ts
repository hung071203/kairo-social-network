import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from 'src/schemas/notifications.schema';
import { NotificationRepository } from 'src/database/repository/notification.repository';
import { GatewaysModule } from 'src/gateways/gateways.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
    ]),
    GatewaysModule
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: 'NotificationRepositoryInterface',
      useClass: NotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
