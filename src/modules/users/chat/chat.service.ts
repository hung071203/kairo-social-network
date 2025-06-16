import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationDto } from 'src/common/decorators';
import { ConversationRepositoryInterface } from 'src/database/interface/conversation.interface';
import { MessageRepositoryInterface } from 'src/database/interface/message.interface';
import {
  CreateConversationDto,
  GetConversationsDto,
  GetMessagesDto,
  SendMessageDto,
} from './dto/chat.dto';
import { FollowService } from '../follow/follow.service';
import { MessageTypeEnum, SenderTypeEnum } from 'src/common/enums';

@Injectable()
export class ChatService {
  constructor(
    @Inject('MessageRepositoryInterface')
    private readonly messageRepository: MessageRepositoryInterface,
    @Inject('ConversationRepositoryInterface')
    private readonly conversationRepository: ConversationRepositoryInterface,
    private readonly followService: FollowService,
  ) {}

  getConversationRepository() {
    return this.conversationRepository;
  }

  getMessageRepository() {
    return this.messageRepository;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (dto.isGroup && dto.participantIds.length < 2) {
      throw new Error('Nhóm trò chuyện phải có ít nhất 2 người tham gia.');
    }
    if (dto.participantIds.includes(userId) && dto.participantIds.length <= 1) {
      throw new Error('Bạn không thể tạo nhóm trò chuyện với chính mình.');
    }

    if (!dto.isGroup) {
      const participantId = dto.participantIds.find((id) => id !== userId);
      if (!participantId) {
        throw new Error('Bạn phải chọn ít nhất một người tham gia khác.');
      }
      const blockedIds = await this.followService.getAllBlocked(userId);
      if (blockedIds.map((item) => item.toString()).includes(participantId)) {
        throw new Error('Bạn không thể trò chuyện với người dùng đã chặn bạn.');
      }

      const isExist = await this.conversationRepository.findOne({
        participants: {
          $all: [
            { $elemMatch: { user: new Types.ObjectId(userId) } },
            { $elemMatch: { user: new Types.ObjectId(participantId) } },
          ],
        },
      });
      if (isExist) {
        throw new Error('Nhóm trò chuyện đã tồn tại.');
      }
    }

    if (!dto.participantIds.includes(userId)) dto.participantIds.push(userId);

    const participants = dto.participantIds.map((user) => ({
      user: new Types.ObjectId(user),
    }));

    const conversation = await this.conversationRepository.create({
      name: dto.name,
      isGroup: dto.isGroup,
      participants,
    });

    return conversation;
  }

  async getConversations(
    userId: string,
    dto: GetConversationsDto,
    pagi: PaginationDto,
  ) {
    return this.conversationRepository.findAllCustom(userId, dto, pagi);
  }

  async getMessages(userId: string, dto: GetMessagesDto, pagi: PaginationDto) {
    return this.messageRepository.findAll(
      {
        conversation: new Types.ObjectId(dto.conversationId),
        ...(dto.createdAt
          ? { createdAt: { $lt: new Date(dto.createdAt) } }
          : {}),
        deletedBy: {
          $nin: [new Types.ObjectId(userId)],
        },
      },
      {
        ...pagi,
        populate: [
          {
            path: 'sender',
            select: 'name username avatar',
          },
          {
            path: 'replyTo',
            populate: {
              path: 'sender',
              select: 'name username avatar',
            },
          },
        ],
        sort: { createdAt: -1 },
      },
    );
  }

  async createMessage(userId: string, dto: SendMessageDto) {
    const conversation = await this.conversationRepository.findOne({
      _id: new Types.ObjectId(dto.conversationId),
      participants: { $elemMatch: { user: new Types.ObjectId(userId) } },
    });

    if (!conversation) {
      throw new Error(
        'Nhóm trò chuyện không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    await this.conversationRepository.update(dto.conversationId, {
      lastMessage: dto.content,
      lastMessageAt: new Date(),
    });

    const data = await this.messageRepository.create({
      conversation: new Types.ObjectId(dto.conversationId),
      sender: new Types.ObjectId(userId),
      content: dto.content,
      type: dto.type,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : null,
    });

    return this.messageRepository
      .getModel()
      .findById(data._id)
      .populate([
        {
          path: 'sender',
          select: 'name username avatar',
        },
        {
          path: 'replyTo',
          populate: {
            path: 'sender',
            select: 'name username avatar',
          },
        },
      ])
      .exec();
  }

  async addReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.messageRepository.findOne({
      _id: new Types.ObjectId(messageId),
    });
    if (!message) {
      throw new Error(
        'Tin nhắn không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }
    const checkReaction = message.reactions.find(
      (item) => item.user.toString() === userId,
    );

    if (!checkReaction) {
      // Add new reaction
      message.reactions.push({
        user: new Types.ObjectId(userId),
        reaction,
      });
    } else {
      // Remove old reaction and add the new one
      message.reactions = message.reactions.filter(
        (item) => item.user.toString() !== userId,
      );
      if (checkReaction.reaction !== reaction) {
        message.reactions.push({
          user: new Types.ObjectId(userId),
          reaction,
        });
      }
    }
    await this.messageRepository.update(messageId, {
      reactions: message.reactions,
    });
    return message.reactions;
  }

  async hideMessageForUser(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      _id: new Types.ObjectId(messageId),
    });
    if (!message) {
      throw new Error(
        'Tin nhắn không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    if (!message.deletedBy.map((i) => i.toString()).includes(userId)) {
      message.deletedBy.push(new Types.ObjectId(userId));
      await this.messageRepository.update(messageId, {
        deletedBy: message.deletedBy,
      });
    }
  }

  async delMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      _id: new Types.ObjectId(messageId),
      sender: new Types.ObjectId(userId),
    });
    if (!message) {
      throw new Error(
        'Tin nhắn không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }
    await this.messageRepository.delete(messageId);
  }

  async changeNickname(
    currentUserId: string,
    userId: string,
    conversationId: string,
    nickname: string,
  ) {
    if (!nickname || nickname.length < 1) {
      throw new Error('Biệt danh không được để trống.');
    }

    const conversation = await this.conversationRepository
      .getModel()
      .findOne({
        _id: new Types.ObjectId(conversationId),
        participants: {
          $elemMatch: { user: new Types.ObjectId(currentUserId) },
        },
      })
      .populate({
        path: 'participants.user',
        select: '_id name username', // chọn trường cần
      });

    if (!conversation) {
      throw new Error(
        'Nhóm trò chuyện không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    const participant: any = conversation.participants.find(
      (p) => p.user._id.toString() === userId,
    );

    const currentUser: any = conversation.participants.find(
      (p) => p.user._id.toString() === currentUserId,
    );

    if (!currentUser) {
      throw new Error(
        'Bạn không phải là thành viên của nhóm trò chuyện này.',
      );
    }

    if (!participant) {
      throw new Error(
        'Người dùng không phải là thành viên của nhóm trò chuyện này.',
      );
    }

    participant.nickname = nickname;

    const newParticipants = conversation.participants.map((p) => {
      return {
        user: p.user._id,
        nickname: p.nickname,
      };
    });

    await this.conversationRepository.update(conversationId, {
      participants: newParticipants,
      lastMessage: `${currentUser.user.name} đã đổi biệt danh của ${participant.user.name} thành "${nickname}"`,
      lastMessageAt: new Date(),
    });

    await this.messageRepository.create({
      conversation: new Types.ObjectId(conversationId),
      senderType: SenderTypeEnum.SYSTEM,
      content: `${currentUser.user.name} đã đổi biệt danh của ${participant.user.name} thành "${nickname}"`,
      type: MessageTypeEnum.TEXT,
    });

    return `${currentUser.user.name} đã đổi biệt danh của ${participant.user.name} thành "${nickname}"`;
  }
}
