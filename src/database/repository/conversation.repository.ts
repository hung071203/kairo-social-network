import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Conversation } from 'src/schemas/conversation.schema';
import { ConversationRepositoryInterface } from '../interface/conversation.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

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
}
