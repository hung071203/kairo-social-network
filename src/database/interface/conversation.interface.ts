import { BaseRepositoryInterface } from 'src/base/base.interface.repository';
import { PaginationDto } from 'src/common/decorators';
import { GetConversationsDto } from 'src/modules/users/chat/dto/chat.dto';
import { Conversation } from 'src/schemas/conversation.schema';

export interface ConversationRepositoryInterface
  extends BaseRepositoryInterface<Conversation> {
  findAllCustom(
    userId: string,
    dto: GetConversationsDto,
    pagi: PaginationDto,
  );
}
