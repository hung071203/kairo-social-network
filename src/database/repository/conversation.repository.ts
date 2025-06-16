import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Conversation } from 'src/schemas/conversation.schema';
import { ConversationRepositoryInterface } from '../interface/conversation.interface';
import { PaginateModel, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/decorators';
import { GetConversationsDto } from 'src/modules/users/chat/dto/chat.dto';

@Injectable()
export class ConversationRepository
  extends BaseRepository<Conversation>
  implements ConversationRepositoryInterface
{
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationRepository: PaginateModel<Conversation>,
  ) {
    super(conversationRepository);
  }

  async findAllCustom(
    userId: string,
    dto: GetConversationsDto,
    pagi: PaginationDto,
  ) {
    const { search, userId: target, conversationId } = dto;
    const pipeline: any[] = [];

    const baseMatch: any = {
      participants: {
        $elemMatch: {
          user: new Types.ObjectId(userId),
        },
      },
    };

    if (search) {
      baseMatch.isGroup = false; // Chỉ tìm trong chat cá nhân nếu có từ khóa
    }

    pipeline.push({ $match: baseMatch });

    // Join user info để hỗ trợ search theo username/name
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'participants.user',
        foreignField: '_id',
        as: 'populatedUsers',
      },
    });

    // Tìm theo từ khóa (search theo username/name hoặc group name)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'populatedUsers.username': { $regex: search, $options: 'i' } },
            { 'populatedUsers.name': { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Gắn cờ isPinned = 1 nếu là đoạn chat với target hoặc có conversationId
    pipeline.push({
      $addFields: {
        isPinned: {
          $cond: {
            if: {
              $or: [
                { $eq: ['$_id', new Types.ObjectId(conversationId)] },
                {
                  $and: [
                    { $eq: ['$isGroup', false] },
                    {
                      $setIsSubset: [
                        [
                          new Types.ObjectId(userId),
                          new Types.ObjectId(target),
                        ],
                        '$participants.user',
                      ],
                    },
                  ],
                },
              ],
            },
            then: 1,
            else: 0,
          },
        },
      },
    });

    // Sắp xếp theo isPinned và thời gian tin nhắn cuối cùng
    pipeline.push({ $sort: { isPinned: -1, lastMessageAt: -1 } });

    // Pagination
    pipeline.push({ $skip: pagi.offset });
    pipeline.push({ $limit: pagi.limit });

    // Chọn trường trả về
    pipeline.push({
      $project: {
        name: 1,
        isGroup: 1,
        lastMessageAt: 1,
        lastMessage: 1,
        participants: 1,
        populatedUsers: {
          username: 1,
          name: 1,
          avatar: 1,
          email: 1,
        },
      },
    });

    return this.conversationRepository.aggregate(pipeline);
  }
}
