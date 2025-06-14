import { Module } from '@nestjs/common';
import { RedisService } from 'src/common/services';
import { NotificationGateway } from './notification/notification.gateway';
import { ConnectionGateway } from './connection/connection.gateway';
import { MessageGateway } from './chat/chat.gateway';

@Module({
  imports: [],
  providers: [RedisService, NotificationGateway, ConnectionGateway, MessageGateway],
  exports: [NotificationGateway],
})
export class GatewaysModule {}
