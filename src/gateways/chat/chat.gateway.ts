import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { MessageTypeEnum } from 'src/common/enums';
import { RedisService } from 'src/common/services';
import { ChatService } from 'src/modules/users/chat/chat.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class MessageGateway {
  private readonly logger = new Logger(MessageGateway.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService, // Assuming you have a RedisService for pub/sub
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() dto: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    const conversationRepository = this.chatService.getConversationRepository();
    const conversation = await conversationRepository.findOne({
      _id: new Types.ObjectId(dto.conversationId),
      participants: { $elemMatch: { user: new Types.ObjectId(userId) } },
    });
    if (!conversation) {
      client.emit('error', {
        message:
          'Nhóm trò chuyện không tồn tại hoặc bạn không có quyền truy cập.',
      });
      return;
    }
    client.join(dto.conversationId);
    await this.redisService.sAdd(
      `${process.env.APP_ID}:socket:users-inroom:${userId}`,
      dto.conversationId,
    );
    this.logger.log(`User ${userId} joined conversation ${dto.conversationId}`);
    client.emit('joined-room', {
      message: `Bạn đã tham gia nhóm trò chuyện ${conversation.name}`,
      conversationId: dto.conversationId,
    });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    dto: {
      conversationId: string;
      content: string;
      type: MessageTypeEnum; // Assuming type is a string, adjust as necessary
      replyTo?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    if (!dto.conversationId || !dto.content || !dto.type) {
      client.emit('error', {
        message: 'Dữ liệu yêu cầu thiếu.',
      });
      return;
    }
    const checkConversation = await this.redisService.sIsMember(
      `${process.env.APP_ID}:socket:users-inroom:${userId}`,
      dto.conversationId,
    );
    if (!checkConversation) {
      client.emit('error', {
        message: 'Bạn không có quyền gửi tin nhắn trong nhóm trò chuyện này.',
      });
      return;
    }
    
    try {
      const message = await this.chatService.createMessage(userId, dto);
      this.server.to(dto.conversationId).emit('messageReceived', message);
      client.emit('messageSent', message);
      this.logger.log(
        `User ${userId} sent a message in conversation ${dto.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
