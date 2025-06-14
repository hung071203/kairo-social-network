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
import {
  AddReactionDto,
  SendMessageDto,
} from 'src/modules/users/chat/dto/chat.dto';

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
    dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    //Lưu ý: chỉ hỗ trợ text, ảnh hoặc video
    //Nếu đầu vào là ảnh hoạc video phải gọi function uploadFile rồi lấy kết quả url emit lên
    // Khi gửi tin nhắn, cần hiện tin nhắn đó với trạng thái đang gửi trước, nếu nhận sk messageReceived với tempId trùng thì sẽ xóa trạng thái đang gửi đó
    // Quan trọng: 1 lần chỉ gửi dc 1 ảnh hoặc 1 video, và không thể gửi kèm text

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
      this.server
        .to(dto.conversationId)
        .emit('messageReceived', { ...message, tempId: dto.tempId });
      this.logger.log(
        `User ${userId} sent a message in conversation ${dto.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('reaction-message')
  async handleReactionMessage(
    @MessageBody() dto: AddReactionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    if (!dto.messageId || !dto.conversationId || !dto.reaction) {
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
        message: 'Bạn không có quyền gửi phản ứng trong nhóm trò chuyện này.',
      });
      return;
    }

    try {
      const reactions = await this.chatService.addReaction(
        userId,
        dto.messageId,
        dto.reaction,
      );
      this.server
        .to(dto.conversationId)
        .emit('reactionReceived', { reactions, messageId: dto.messageId });
      this.logger.log(
        `User ${userId} reacted to message ${dto.messageId} in conversation ${dto.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('hide-message')
  async handleHideMessage(
    @MessageBody() dto: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    if (!dto.messageId || !dto.conversationId) {
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
        message: 'Bạn không có quyền ẩn tin nhắn trong nhóm trò chuyện này.',
      });
      return;
    }

    try {
      await this.chatService.hideMessageForUser(userId, dto.messageId);
      this.server
        .to(dto.conversationId)
        .emit('messageHidden', { messageId: dto.messageId });
      this.logger.log(
        `User ${userId} hide message ${dto.messageId} in conversation ${dto.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @MessageBody() dto: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    if (!dto.messageId || !dto.conversationId) {
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
        message: 'Bạn không có quyền xóa tin nhắn trong nhóm trò chuyện này.',
      });
      return;
    }

    try {
      await this.chatService.delMessage(userId, dto.messageId);
      this.server
        .to(dto.conversationId)
        .emit('messageDeleted', { messageId: dto.messageId });
      this.logger.log(
        `User ${userId} deleted message ${dto.messageId} in conversation ${dto.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
