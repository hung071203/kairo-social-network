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

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class ConnectionGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ConnectionGateway.name);

  constructor(
    private readonly redis: RedisService, // Assuming you have a RedisService for pub/sub
    private readonly jwtService: JwtService, // Assuming you have a JwtService for token validation
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const cookies = client.handshake.headers.cookie; // Lấy tất cả cookie từ headers
    if (!cookies) {
      client.emit('error', { message: 'Không tìm thấy cookie!' });
      client.disconnect();
      return;
    }

    // Tách cookie và lấy giá trị `hungdev_token`
    const token = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('hungdev_token_media='))
      ?.split('=')[1]; // Lấy giá trị sau dấu `=`

    if (token) {
      try {
        const decoded = this.jwtService.verify(token); // Xác thực token

        client.join(decoded.sub);
        await this.redis.sAdd(
          `${process.env.APP_ID}:socket:users-online`,
          decoded.sub,
        );
        await this.redis.sAdd(
          `${process.env.APP_ID}:socket:users-inroom:${decoded.sub}`,
          decoded.sub,
        );
        await this.redis.set(decoded.sub, client.id); // Lưu socket ID với thời gian hết hạn 1 giờ
        client.data.user = decoded; // Lưu user ID vào dữ liệu của client
        client.emit('connected', {
          message: 'Kết nối thành công',
          userId: decoded.sub,
        });
        this.sendUserOnline();
        this.logger.log(
          `User ${decoded.sub} connected with socket ID ${client.id}`,
        );
      } catch (err) {
        client.emit('error', {
          message: err.message,
        });
        client.disconnect();
      }
    } else {
      client.emit('error', {
        message: 'Không tìm thấy token trong cookie!',
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      await this.redis.sRem(
        `${process.env.APP_ID}:socket:users-online`,
        user.sub,
      );
      await this.redis.del(
        `${process.env.APP_ID}:socket:users-inroom:${user.sub}`, // Xóa socket ID khỏi Redis
      );
      await this.redis.del(
        user.sub, // Xóa socket ID khỏi Redis
      );
      this.sendUserOnline();
      this.logger.log(
        `User ${user.sub} disconnected from socket ID ${client.id}`,
      );
    }
  }

  async sendUserOnline() {
    const usersOnline = await this.redis.sMembers(
      `${process.env.APP_ID}:socket:users-online`,
    );

    this.server.emit('user-online', {
      usersOnline,
    });
  }
}
