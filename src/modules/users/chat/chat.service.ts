import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationDto } from 'src/common/decorators';
import { ConversationRepositoryInterface } from 'src/database/interface/conversation.interface';
import { MessageRepositoryInterface } from 'src/database/interface/message.interface';
import { CreateConversationDto, GetMessagesDto, SendMessageDto } from './dto/chat.dto';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject('MessageRepositoryInterface')
    private readonly messageRepository: MessageRepositoryInterface,
    @Inject('ConversationRepositoryInterface')
    private readonly conversationRepository: ConversationRepositoryInterface,
    private readonly followService: FollowService
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
    if(dto.participantIds.includes(userId) && dto.participantIds.length <= 1) {
      throw new Error('Bạn không thể tạo nhóm trò chuyện với chính mình.');
    }

    if(!dto.isGroup) {
      const participantId = dto.participantIds.find((id) => id !== userId);
      if (!participantId) {
        throw new Error('Bạn phải chọn ít nhất một người tham gia khác.');
      }
      const blockedIds = await this.followService.getAllBlocked(userId);
      if (blockedIds.map((item) => item.toString()).includes(participantId)) {
        throw new Error('Bạn không thể trò chuyện với người dùng đã chặn bạn.');
      }
    }

    if(!dto.participantIds.includes(userId)) dto.participantIds.push(userId);

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

  async getConversations(userId: string, search: string, pagi: PaginationDto) {
    return this.conversationRepository.findAllCustom(userId, search, pagi);
  }

  async getMessages(dto: GetMessagesDto, pagi: PaginationDto) {
    return this.messageRepository.findAll(
      {
        conversation: new Types.ObjectId(dto.conversationId),
        ...(dto.createdAt
          ? { createdAt: { $lt: new Date(dto.createdAt) } }
          : {}),
      },
      pagi,
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

    await this.conversationRepository.update(
      dto.conversationId,
      {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
      }
    )

    return this.messageRepository.create({
      conversation: new Types.ObjectId(dto.conversationId),
      sender: new Types.ObjectId(userId),
      content: dto.content,
      type: dto.type,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : null,
    });
  }
}
