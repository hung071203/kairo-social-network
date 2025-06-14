import { BaseRepositoryInterface } from 'src/base/base.interface.repository';
import { PaginationDto } from 'src/common/decorators';
import { Conversation } from 'src/schemas/conversation.schema';

export interface ConversationRepositoryInterface
  extends BaseRepositoryInterface<Conversation> {
  findAllCustom(
    userId: string,
    search: string,
    pagi: PaginationDto,
  );
}
