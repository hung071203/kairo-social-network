import { Module } from '@nestjs/common';
import { RedisService } from 'src/common/services';
import { NotificationGateway } from './notification/notification.gateway';
import { ConnectionGateway } from './connection/connection.gateway';

@Module({
  imports: [],
  providers: [RedisService, NotificationGateway, ConnectionGateway],
  exports: [NotificationGateway],
})
export class GatewaysModule {}
