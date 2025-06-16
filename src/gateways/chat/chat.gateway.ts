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
import { FollowService } from 'src/modules/users/follow/follow.service';
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
    private readonly followService: FollowService,
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('join-room')
  async handleJoinRoom(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.sub as string;
    const conversationRepository = this.chatService.getConversationRepository();

    const getAllFollowers = (
      await this.followService.getAllFollowers(userId)
    ).map((item) => item.toString());
    const getAllFollowing = (
      await this.followService.getAllFollowing(userId)
    ).map((item) => item.toString());

    const getAllBlocked = (await this.followService.getAllBlocked(userId)).map(
      (item) => item.toString(),
    );

    const uniqueUserIds = Array.from(
      new Set([...getAllFollowers, ...getAllFollowing]),
    );
    const createConversationPromises = uniqueUserIds.map(
      async (participantId) => {
        const isExist = await conversationRepository.findOne({
          participants: {
            $all: [
              { $elemMatch: { user: new Types.ObjectId(userId) } },
              { $elemMatch: { user: new Types.ObjectId(participantId) } },
            ],
          },
        });

        if (!isExist) {
          await conversationRepository.create({
            participants: [
              { user: new Types.ObjectId(userId) },
              { user: new Types.ObjectId(participantId) },
            ],
            isGroup: false,
            name: '',
          });
        }
      },
    );
    await Promise.allSettled(createConversationPromises);

    const validConversations = (await conversationRepository.findAll({
      participants: { $elemMatch: { user: new Types.ObjectId(userId) } },
    })) as Conversation[];

    if (validConversations.length === 0) {
      client.emit('error', {
        message: 'Bạn không có nhóm trò chuyện nào để tham gia.',
      });
      return;
    }
    const validConversationIds = []
    const newPromise = validConversations.map(async (item) => {
      if (!item.isGroup) {
        const participant = item.participants.find(
          (p) => p.user.toString() !== userId,
        );
        if (!participant || getAllBlocked.includes(participant.user.toString())) {
          return; // Skip if the participant is blocked or not found
        }
      }
      const id = item._id.toString();
      validConversationIds.push(id);
      client.join(id);
      await this.redisService.sAdd(
        `${process.env.APP_ID}:socket:users-inroom:${userId}`,
        id,
      );
    });

    await Promise.allSettled(newPromise);
    this.logger.log(`User ${userId} joined conversation: ` + validConversationIds.join(', '));
    client.emit('joined-room', {
      message: `Bạn đã tham gia nhóm trò chuyện `,
      conversationIds: validConversationIds,
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
    dto = dto[0] || dto; // Handle array or single object
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
      client.emit('messageHidden', { messageId: dto.messageId });
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
    dto = dto[0] || dto; // Handle array or single object
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

  @SubscribeMessage('change-nickname')
  async handleChangeNickname(
    @MessageBody() dto: { conversationId: string; nickname: string, userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub as string;
    dto = dto[0] || dto; // Handle array or single object
    if (!dto.conversationId || !dto.nickname) {
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
        message: 'Bạn không có quyền thay đổi biệt danh trong nhóm trò chuyện này.',
      });
      return;
    }

    try {
      const message = await this.chatService.changeNickname(userId, dto.userId, dto.conversationId, dto.nickname);
      this.server
        .to(dto.conversationId)
        .emit('nicknameChanged', { conversationId: dto.conversationId, nickname: dto.nickname, userId: dto.userId, message });
      this.logger.log(
        `User ${userId} changed nickname in conversation ${dto.conversationId} to ${dto.nickname}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
