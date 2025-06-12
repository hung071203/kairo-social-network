import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/common/services';
import { Notification } from 'src/schemas/notifications.schema';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class NotificationGateway {
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly redis: RedisService, // Assuming you have a RedisService for pub/sub
    private readonly jwtService: JwtService, // Assuming you have a JwtService for token validation
  ) {}
  @WebSocketServer() server: Server;

  async sendNotification(data: Notification) {
    return this.server.to(data.user.toString()).emit('notificationReceived', data);
  }
}
