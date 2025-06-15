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
import { Conversation } from 'src/schemas/conversation.schema';

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
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    const conversationRepository = this.chatService.getConversationRepository();

    const validConversations = await conversationRepository.findAll({
      participants: { $elemMatch: { user: new Types.ObjectId(userId) } },
    }) as Conversation[];

    if (validConversations.length === 0) {
      client.emit('error', {
        message: 'Bạn không có nhóm trò chuyện nào để tham gia.',
      });
      return;
    }

    const newPromise = validConversations.map(async (item) => {
      const id = item._id.toString();
      client.join(id);
      await this.redisService.sAdd(
        `${process.env.APP_ID}:socket:users-inroom:${userId}`,
        id,
      );
    })

    await Promise.allSettled(newPromise);

    const ids = validConversations.map((item) => item._id.toString()).join(', ');

    this.logger.log(`User ${userId} joined conversation: ` + ids);
    client.emit('joined-room', {
      message: `Bạn đã tham gia nhóm trò chuyện `,
      conversationIds: validConversations.map((item) => item._id.toString()),
    });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    dto = dto[0] || dto; // Handle array or single object
    if (!dto.conversationId || !dto.content || !dto.type) {
      console.log('dto', dto);
      
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
      const message: any = await this.chatService.createMessage(userId, dto);
      this.server
        .to(dto.conversationId)
        .emit('messageReceived', { ...message._doc, tempId: dto.tempId });
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
    dto = dto[0] || dto; // Handle array or single object
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
