import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Conversation } from 'src/schemas/conversation.schema';
import { ConversationRepositoryInterface } from '../interface/conversation.interface';
import { PaginateModel, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/decorators';

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

  async findAllCustom(userId: string, search: string, pagi: PaginationDto) {
    return this.conversationRepository.aggregate([
      {
        $match: {
          participants: {
            $elemMatch: {
              user: new Types.ObjectId(userId),
            },
          },
          ...(search ? { isGroup: false } : {}),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.user',
          foreignField: '_id',
          as: 'populatedUsers',
        },
      },
      {
        $match: search
          ? {
              $or: [
                {
                  'populatedUsers.username': { $regex: search, $options: 'i' },
                },
                { 'populatedUsers.name': { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
              ],
            }
          : {},
      },
      {
        $sort: { lastMessageAt: -1 },
      },
      {
        $skip: pagi.offset,
      },
      {
        $limit: pagi.limit,
      },
      {
        $project: {
          name: 1,
          isGroup: 1,
          lastMessageAt: 1,
          participants: 1,
          populatedUsers: {
            username: 1,
            name: 1,
            avatar: 1,
            email: 1,
          },
        },
      },
    ]);
  }
}
