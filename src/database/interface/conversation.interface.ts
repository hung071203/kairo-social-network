import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { Conversation } from "src/schemas/conversation.schema";

export interface ConversationRepositoryInterface extends BaseRepositoryInterface<Conversation> {}