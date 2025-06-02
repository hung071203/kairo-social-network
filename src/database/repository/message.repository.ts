import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Message } from 'src/schemas/messages.schema';
import { MessageRepositoryInterface } from '../interface/message.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MessageRepository
  extends BaseRepository<Message>
  implements MessageRepositoryInterface
{
  constructor(
    @InjectModel(Message.name)
    private readonly messageRepository: PaginateModel<Message>,
  ) {
    super(messageRepository);
  }
}
